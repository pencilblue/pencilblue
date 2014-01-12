global.lastMilliseconds = 0;
global.uniqueCounter = 0;
global.alphaKeyCharacters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

global.uniqueID = function(output)
{
    var milliseconds = new Date().getTime() - 1262304000000;
    if(milliseconds == lastMilliseconds)
    {
		uniqueCounter++;
		
		// Rollover protection
		if(uniqueCounter >= 1000)
		{
			uniqueCounter = 0;
		}
	}
	else
	{
		lastMilliseconds = milliseconds;
		uniqueCounter = 0;
	}
	
	milliseconds = milliseconds * Math.pow(2, 12);
	var id2 = parseInt(Math.random() * 1000000) * Math.pow(2, 8);
	var uid = milliseconds.toString(16) + '-' + uniqueCounter + '-' + id2 + '-' + getAlphanumericKey(16);
	
	if(output){
		output(uid);
	}
	return uid;
};

global.getAlphanumericKey = function(keyLength)
{
    var key = '';
    for(var i = 0; i < keyLength; i++)
    {
        key += alphaKeyCharacters[parseInt(Math.random() * alphaKeyCharacters.length)];
    }
    
    return key;
};
