const axios = require('axios');
const Twitter = require('twit');


const config = {
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_SECRET_KEY,
    access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

const client = new Twitter(config);

module.exports.hello = async (event, context, cb) => {

    try{

        const last100Tweets = await client.get("statuses/user_timeline", {
            screen_name: 'DosageOfJokes',
            count:100,
            tweet_mode: 'extended'
        }).then(tweets=>tweets.data.map(tweet=>tweet.full_text.split('\n\n')[0]));

        let tweetNotAcceptable = true;
        let newTweet = '';

        while(tweetNotAcceptable){
            const category = await selectRandomCategory();
            const joke = await fetchJoke(category);
            const hashtags = `\n\n#jokes #funny #ChuckNorris #${category}jokes`;

            const tweet = joke.trim()+hashtags;

            if(!tweet.includes(process.env.unwantedWord) && !last100Tweets.includes(joke.trim()) && tweet.length<=280){
                tweetNotAcceptable=false;
                newTweet = tweet;
            }
        }


        

        const response = await client.post("statuses/update", {
            status: newTweet,
            
        });

        console.log(response);

        return response;

    }catch(err){

        console.log({
            error: err
        });
        return {
            error: err
        }
    }
    
}


async function fetchJoke(category='food'){
    try{
      const joke =  await axios({
        "method":"GET",
        "url":`${process.env.JOKE_API_URL}/random`,
        "headers":{
        "content-type":"application/octet-stream",
        "accept":"application/json",
        "useQueryString":true
        },
        "params":{
            "category": category
        }
        }).then(res=>res.data);

        return joke.value;

    }catch(err){
        return err;
    }
}

async function selectRandomCategory(){
    try{
        const categories =  await axios({
          "method":"GET",
          "url":`${process.env.JOKE_API_URL}/categories`,
          "headers":{
          "content-type":"application/octet-stream",
          "accept":"application/json",
          "useQueryString":true
          }
          }).then(res=>{
              const unwantedCategories = ['explicit', 'political', 'religion'];

            return res.data.filter(category=>!unwantedCategories.includes(category));
          });
  
          return categories[Math.floor(Math.random()*categories.length)];
  
      }catch(err){
          return err;
      }
}