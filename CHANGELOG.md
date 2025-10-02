# Changelog

## 1.0.0 (2025-10-02)


### Features

* add admin approve and revoke for groups and platforms ([f74046f](https://github.com/AustralianBioCommons/aai-portal/commit/f74046f931425c30a9f5c0f9c84afaf5ed9551c8))
* add guards based on individual platform admin status AAI-388 ([545815e](https://github.com/AustralianBioCommons/aai-portal/commit/545815ea835f195c92e0d3c4d3b1cae7bd5fbf4e))
* Add loading spinner component with accessibility features ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* Enhance PendingComponent with signals and improved error handling ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* enhance routing with login guard and add allowed email domains for SBP registration ([120c4f7](https://github.com/AustralianBioCommons/aai-portal/commit/120c4f756620c3555a86511abc9fb007a38eb2a9))
* enhance validation service with password confirmation logic and update registration forms ([aa6094a](https://github.com/AustralianBioCommons/aai-portal/commit/aa6094a4dc4cc899216c272045eb885b74ef1dc7))
* Implement auth interceptor for API requests ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* Implement loading state and error handling in AccessComponent ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* implement password confirmation validation setup in registration forms ([ff50d35](https://github.com/AustralianBioCommons/aai-portal/commit/ff50d3543b025e315f21c11fa3031f3b06526f96))
* integrate alert component for error notifications in registration and login flows ([98a1203](https://github.com/AustralianBioCommons/aai-portal/commit/98a12039ada2ee7c39f3b22be82dadf76456124f))
* integrate reCAPTCHA for registration forms ([2026279](https://github.com/AustralianBioCommons/aai-portal/commit/2026279a7b59245128817e3455b09c5fa2adc190))
* integrate reCAPTCHA verification in registration forms and update UI components ([458e198](https://github.com/AustralianBioCommons/aai-portal/commit/458e198beb2bf7f908e7f0bd1823461b748621d9))
* Refactor NavbarComponent to use signals for authentication and pending count ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* Revamp ServicesComponent to use signals and improve API integration ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* update reCAPTCHA integration to ng-recaptcha-2 ([d0d71ac](https://github.com/AustralianBioCommons/aai-portal/commit/d0d71acead9252b35521f1d1f9e8b338a9b3069a))
* white list email domains for sbp registration ([c0a59fd](https://github.com/AustralianBioCommons/aai-portal/commit/c0a59fdaf1fa7e9ab6a094eaa7867411273776da))


### Bug Fixes

* Correct isAuthenticated function call and improve error handling in PendingComponent ([cb1d512](https://github.com/AustralianBioCommons/aai-portal/commit/cb1d51216ccc1f3e2b63211da1ce941a3320115a))
* make revocation reasoning mandatory ([1442527](https://github.com/AustralianBioCommons/aai-portal/commit/1442527b7d386710f86aeffd2e943ed412121953))
* remove audience and scope from Auth0 configuration in environment files ([fe393d3](https://github.com/AustralianBioCommons/aai-portal/commit/fe393d3eb2a5b6dcfeadd03e0b938c20887e30ae))
* remove console log from alert dismissal method ([cbbb33e](https://github.com/AustralianBioCommons/aai-portal/commit/cbbb33ec15be9af4e611c0d551bf452369664531))
* remove unnecessary status in admin api helpers ([7d2a11f](https://github.com/AustralianBioCommons/aai-portal/commit/7d2a11f7cf94ff2bc360209765255def106d711f))
* update Auth0 domain in environment files to use development subdomain ([7414b8c](https://github.com/AustralianBioCommons/aai-portal/commit/7414b8c5cf0dff9b4ab9146a5ac337452208f884))
* Update environment configuration for backend URL ([bc13f53](https://github.com/AustralianBioCommons/aai-portal/commit/bc13f53fcbc7ac191e92ffbcf4b68692ec1d3c9e))
* update error notification background color and restore backend URL ([acf72af](https://github.com/AustralianBioCommons/aai-portal/commit/acf72af34642c9defa49a4ace4008aabbd5cac0f))
* update password confirmation validation to check for password mismatch ([4c31f92](https://github.com/AustralianBioCommons/aai-portal/commit/4c31f92a5ac155a502cd8d58b2a759ea855da1b2))
* update production flag to true in environment configuration ([1112050](https://github.com/AustralianBioCommons/aai-portal/commit/1112050f81a8e3cd8c764e71d184ae04988cd0df))
* update RegistrationRequest interface to use snake_case for first_name and last_name ([371792c](https://github.com/AustralianBioCommons/aai-portal/commit/371792c784cf030bc0c00c35faa2d0729c7a5e4f))
