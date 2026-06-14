@for /f "tokens=*" %%i in ('rustc --print sysroot') do @"%%i\..\stable-x86_64-pc-windows-gnu\lib\rustlib\x86_64-pc-windows-gnu\bin\rust-lld.exe" -flavor ld %*
