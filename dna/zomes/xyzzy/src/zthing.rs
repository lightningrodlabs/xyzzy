pub use hdk::prelude::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use crate::error::*;
use crate::signals::*;

/// Zthing entry definition
#[hdk_entry(id = "zthing")]
#[derive(Clone)]
pub struct Zthing {
    pub name: String,
    pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ZthingOutput {
    hash: EntryHashB64,
    content: Zthing,
}


fn get_zthings_path() -> Path {
    Path::from("zthings")
}

#[hdk_extern]
fn create_zthing(input: Zthing) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input.clone())?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewZthing(input)))?;
    let path = get_zthings_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_zthings(_: ()) -> ExternResult<Vec<ZthingOutput>> {
    let path = get_zthings_path();
    let anchor_hash = path.hash()?;
    let zthings = get_zthings_inner(anchor_hash)?;
    Ok(zthings)
}

fn get_zthings_inner(base: EntryHash) -> XyzzyResult<Vec<ZthingOutput>> {
    let links = get_links(base, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let zthing_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let zthing_entries: Vec<Zthing> = zthing_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(g),
            _ => None,
        })
        .collect();

    let mut zthings = vec![];
    for e in zthing_entries {
        zthings.push(ZthingOutput {
            hash: hash_entry(&e)?.into(),
            content: e,
        });
    }
    Ok(zthings)
}
