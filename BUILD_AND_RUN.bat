@echo off
REM Build Backend
echo Building backend...
cd backend
call mvnw.cmd clean package -DskipTests
echo.
echo Backend build complete!
echo Run the JAR file:
echo java -jar target\support-0.0.1-SNAPSHOT.jar
echo.
REM If you want to run it directly, uncomment below:
REM start java -jar target\support-0.0.1-SNAPSHOT.jar

