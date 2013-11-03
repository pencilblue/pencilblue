# CHANGELOG

## v0.3.11 2013-10-22

  * Bumped version to 0.3.11
  * style update 2095d3a96f027fc9c417bcee8c7aaa7f725adf5e
  * fix tests 17a3632f875d31f5571ed8aa290138836d32a34e
  * DSN Support implemented. (irvinzz) d1e8ba29874fac9c44a111371a6cd33c606f0aad

## v0.3.10 2013-09-09

  * Bumped version to 0.3.10
  * added greetingTimeout, connectionTimeout and rejectUnathorized options to connection pool 8fa55cd3b0ca7bf69ca98b9244a4d2ff7d799b86

## v0.3.9 2013-09-09

  * Bumped version to 0.3.9
  * added "use strict" definitions, added new options for client: greetingTimeout, connectionTimeout, rejectUnathorized 51047ae0770562791c62015a8259138741c66935
  * Do not include localAddress in the options if it is unset 7eb0e8fc6c15bc9f33468b0e98705d1a8ae52070

## v0.3.8 2013-08-21

  * Bumped version to 0.3.8
  * short fix for #42, Client parser hangs on certain input (dannycoates) 089f5cd460b4f7b140095de38ec0e2a1023d1015

## v0.3.7 2013-08-16

  * Bumped version to 0.3.7
  * minor adjustments for better portability with browserify (whiteout-io) 1571549871a6d27cfa99e03c25d31c08423518c1 
  * Added raw message to error object (andremetzen) 1571549871a6d27cfa99e03c25d31c08423518c1
  * Passing to error handler the message sent from SMTP server when an error occurred (andremetzen) 15d4cbb40707908ee8f7bf070ae7e1a6a96a3e93

## v0.3.6 2013-08-06

  * Bumped version to 0.3.6
  * Added changelog
  * Timeout if greeting is not received after connection is established