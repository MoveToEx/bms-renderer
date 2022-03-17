bms-renderer
============

Like [BMX2WAV], but written in JavaScript, works on a Mac, and outputs 32-bit floating point WAV files.

Some modifications are made so that this repo is easier to use.  

# Usage

First clone the repo and install all the npm modules:

```pwsh
PS> git clone https://github.com/MoveToEx/bms-renderer.git
PS> cd bms-renderer
PS> npm install
```

After the installation finishes, drag your BMS file (like *.bms, *.bme) onto `quick-convert.bat` and wait for it to complete.  
And the `output.wav` in the folder is your result.

# Note

This repo is only compatible with Windows x64 systems and x64 NodeJS.  
If you are using 32-bit Windows or NodeJS, you need to modify `snd.js` according to the documents of `sndfile`, changing the types of every pointer from int64 to int32 so that the address offset works normally. Also remember to replace the `sndfile.dll` with a x86 version.  
However, replacing `sndfile.js` with the one in the original repo may help.

---

If you encounter errors suggesting that it doesn't work with clips that are not 44100Hz, one easy solution is to convert everything straight to 44100Hz. With `ffmpeg`, for example:

```pwsh
PS> mkdir converted
PS> # You may need to change wav to ogg according to your bms file
PS> ls *.wav | % {
>> ffmpeg -i $_ -ar 44100 "./converted/$($_.Name)"
>> }
PS> ls -Exclude *.wav | % {
>> cp $_ "./converted/$($_.Name)"
>> }
```

Try again with bms file in `converted` folder.

---

If you encounter anything that seems to be a C++ error which gives a lot of memory addresses and symbol names, an easy but unreasonable solution is to try again with the bms file of another difficulty.  
I know it's confusing, but it does work.

[BMX2WAV]: http://childs.squares.net/program/bmx2wav/
