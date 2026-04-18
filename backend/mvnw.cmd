@echo off
set MAVEN_WRAPPER_JAR=.mvn\wrapper\maven-wrapper.jar
if exist %MAVEN_WRAPPER_JAR% (
  java %MAVEN_OPTS% -jar %MAVEN_WRAPPER_JAR% %*
) else (
  mvn %*
)
