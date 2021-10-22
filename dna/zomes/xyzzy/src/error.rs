use hdk::prelude::*;
use std::convert::Infallible;

#[derive(thiserror::Error, Debug)]
pub enum XyzzyError {
    #[error(transparent)]
    Serialization(#[from] SerializedBytesError),
    #[error(transparent)]
    Infallible(#[from] Infallible),
    #[error(transparent)]
    EntryError(#[from] EntryError),
    #[error("Failed to convert an agent link tag to an agent pub key")]
    AgentTag,
    #[error(transparent)]
    Wasm(#[from] WasmError),
    #[error(transparent)]
    Timestamp(#[from] TimestampError),
}

pub type XyzzyResult<T> = Result<T, XyzzyError>;

impl From<XyzzyError> for WasmError {
    fn from(c: XyzzyError) -> Self {
        WasmError::Guest(c.to_string())
    }
}
