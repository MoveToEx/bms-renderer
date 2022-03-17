$TARBALL=npm pack
$VERSION=node version.js
$OrigPath = $PWD

if ([System.IO.File]::Exists("dist/bms-renderer-$VERSION")) {
    Remove-Item -Recurse "dist/bms-renderer-$VERSION"
}
mkdir "dist/bms-renderer-$VERSION"

tar -xvzf "$TARBALL" -C "dist/bms-renderer-$VERSION" --strip-components=1

Remove-Item "$TARBALL"

Set-Location "dist/bms-renderer-$VERSION"
npm install --production --no-optional
Set-Location $OrigPath

Set-Location "dist"
Compress-Archive -Path "bms-renderer-$VERSION" -DestinationPath "bms-renderer-$VERSION.zip"

Set-Location $OrigPath