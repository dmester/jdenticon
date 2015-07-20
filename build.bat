@echo off
echo.
echo Enter version:
set /P version=
echo.

mkdir dist 2>NUL
del /Q dist\*.* >NUL

mkdir releases 2>NUL

mkdir obj 2>NUL
del /Q obj\*.* >NUL

rem obj files
del /Q out.~js 2>&1 >NUL

copy /Y jdenticon.js obj\jdenticon-%version%.js >NUL
copy /Y license.txt obj\ >NUL
copy /Y readme.md obj\readme.txt >NUL
copy /Y changelog.txt obj\ >NUL

utils\closure\compiler.jar --js=jdenticon.js --js_output_file=out.~js --compilation_level ADVANCED_OPTIMIZATIONS

rem Append header
copy /B header.txt + out.~js obj\jdenticon-%version%.min.js >NUL

rem Timestamp
utils\misc\DateTimeFormat --utc --format "yyyy-MM-ddTHH:mm:ssZ" > date.~tmp
set /P date= < date.~tmp
utils\misc\DateTimeFormat --utc --format "yyyy" > date.~tmp
set /P year= < date.~tmp
del date.~tmp

copy jdenticon.nuspec ~jdenticon.nuspec
copy /Y bower.template.json bower.json

rem Replace version
utils\misc\replace "{version}=%version%" "{date}=%date%" "{year}=%year%" obj\jdenticon-%version%.js obj\jdenticon-%version%.min.js obj\readme.txt obj\license.txt bower.json ~jdenticon.nuspec
utils\misc\replace "0.0.0=%version%" package.json

rem Create NuGet Package
utils\nuget\NuGet.exe pack ~jdenticon.nuspec -OutputDirectory releases
del /Q ~jdenticon.nuspec

rem Populate dist directory
copy obj\jdenticon-%version%.min.js dist\jdenticon.min.js
copy obj\jdenticon-%version%.js dist\jdenticon.js

rem obj files
del /Q out.~js

rem Create zip
del /Q releases\jdenticon.%version%.zip
cd obj
..\utils\7z\7za a -tzip ..\releases\jdenticon.%version%.zip *
cd ..

pause