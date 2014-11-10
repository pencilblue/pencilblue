angular.module('password', [])
.service('passwordService', function() {
	this.checkPasswordMatch = function(password1, password2) {
		return password1 === password2;
	};

	this.generatePassword = function() {
		var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

		var password = '';
		while(password.length < 12)
		{
			password = password.concat(characters[parseInt(Math.random() * characters.length)]);
		}

		return password;
	};
});
