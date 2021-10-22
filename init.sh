#!/bin/bash
function replace {
    oLower=$1
    oUpper="${oLower^}"
    lower=$2
    upper="${lower^}"
    echo "Replacing all occurences of $oUpper with $upper "
    git ls-files | tr '\n' '\000' | xargs -0 sed -i '' -e "s/$oUpper/$upper/g"
    echo "Replacing all occurences of $oLower with $lower "
    git ls-files | tr '\n' '\000' | xargs -0 sed -i '' -e "s/$oLower/$lower/g"
}
function rename {
    for fileType in d f
    do    
        find  -type $fileType -iname "$1*" |while read file
        do
        mv $file $( sed -r "s/$1/$2/" <<< $file )
        done
    done
}
echo "Project name?"
read project
echo "Main data type?"
read datatype

echo "Setting up git"
git init
git add .
git reset HEAD -- init.sh

replace xyzzy $project
replace zthing $datatype

echo "renaming files"
rename xyzzy $project
rename zthing $datatype

git add .
git rm -f init.sh
git rm -f README.md
git mv README_TEMPLATE.md README.md
