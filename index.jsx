import React, { useState } from 'react';
import { makeStyles } from "tss-react/mui";
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Papa from 'papaparse';
import axios from 'axios';
import pako from 'pako';
// const  Cheerio  = require('cheerio');

const useStyles =  makeStyles()((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    marginLeft: theme.spacing(3),
  },
  formControl: {
    marginBottom: theme.spacing(3),
    
    minWidth: 120,
    width: '90%',
  },
  button: {
    marginTop: theme.spacing(2),
  },
}));

const Detailbook = () => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    filename: '',
    serpQuery: '',
    token: '',
    numResults: '',
    resultTimeline:'lastMonth'
  });

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData({ ...formData, [id]: value });
  };
  const handleSelectChange = (event) => {
    setFormData({ ...formData, resultTimeline: event.target.value });
  };

  async function saveSettings() {
    const { filename, serpQuery, token,  numResults, resultTimeline } = formData;
    const btn = document.getElementById('startBtn');
    const statusEl = document.getElementById('status')
    try {
        btn.setAttribute("disabled", "true");
        btn.textContent = "Loading...";
        statusEl.textContent = `Making serp call...`


        let SerpResult = await callSerpAPI(serpQuery, token, numResults, resultTimeline);
        let [SerpResponse, serpLinkJson, serpTitleJson] = extractSerp(SerpResult);
        
        if (SerpResponse.length === 0) {
          throw new Error("NO SERP RESPONSE FOUND");
        }
        
        let output = [];
        const verbs = [
          "Raises", "Raised", "Lands", "Grabs", "Nabs", "Secures", "Wins", "Snags",
          "Announces", "Closes", "Leads", "Plans", "Uses", "Mortgaged", "Gets", "Banks",
          "Scoops", "Picks up", "Fetches", "Gains", "Obtains", "Snaps up"
        ];
        const keys = [
          "Size", "totalFunding", "facebook", "twitter", "linkedin", "Geo", 
          "Industry", "companyName", "Specialization", "growth6", "growth12", "growth24", 
          "Growth"
        ];
        
        const createEmptyObject = (keys) => {
          const obj = {};
          keys.forEach(key => {
            obj[key] = "";
          });
          return obj;
        };
        const replaceKey = (obj, oldKey, newKey) => {
          obj[newKey] = obj[oldKey];
          delete obj[oldKey];
        }
        
        const verbPattern = new RegExp(`\\b(${verbs.join('|').replace(/\s+/g, '\\s+')})\\b`, 'i');
        const emptyEnrichment = createEmptyObject(keys);

        for (let index=0; index<serpLinkJson.length; index++) {
            if(!serpTitleJson[index].Title.includes('$') || !verbPattern.test(serpTitleJson[index].Title)) {continue;}
            if (serpLinkJson[index].Link.startsWith("https://")) {
                serpLinkJson[index].Link = serpLinkJson[index].Link.replace("https://", "http://");
            }
            try {
                // Await the asynchronous call to 
                statusEl.textContent = `Running for ${serpLinkJson[index].Link}`;
                console.log(`Running for ${serpLinkJson[index].Link}`);
                let Scraperesult = await callScrapeAPI(serpLinkJson[index].Link, token);
                let ScrapeJson = await formatResult(Scraperesult, token);
                let format = rawformat();
                let prompt = `Headings - ${ScrapeJson['h1']}\n ${ScrapeJson['h2']}\n Details -${ScrapeJson['p']}\n 
                Above is a news for Startup.
                Which specific lines in the news captures startups plan to deploy the capital. Possible plans could be: Userbase growth, New Product Launch, New Feature Launch, Adjustment to Market Dynamics, Increase Revenue/Profit, Strategic Partnership, Customer Satisfaction, International Expansion
                Output in a JSON for all plans. 
                ${format}
                Dont change the JSON structure.
                Your goal is to come up with as many different plans possible.
                YOU MUST USE PLAN NAMES EXACTLY AS GIVEN. DONOT COME UP ANY NEW PLAN NAME. `
                    
                let responses = await getOpenAIResponse(prompt, token);
                statusEl.textContent = `Enriching Data for ${responses[0]["Account"]}`;
                let link = await getCompanyDomain(responses[0]["Account"], token);
                let response=[];
                if(!link || (link && link.length == 0)){
                  for(let mem=0; mem<Object.keys(responses[0]["Plans"]["data"]).length; mem++){
                    let plans =[];
                    plans["Account"] = responses[0]["Account"];
                    plans["Primary Trigger"] = responses[0]["Primary Trigger"];
                    plans["Secondary Trigger"] = responses[0]["Plans"]["data"][mem]["Secondary Trigger"];
                    plans["Source"] = responses[0]["Plans"]["data"][mem]["Source"];
                    plans["Confidence"] = responses[0]["Plans"]["data"][mem]["Confidence"];
                    plans["Source website"] = serpLinkJson[index].Link;
                    response.push(plans);
                    let finalResponse = {...response[mem], ...emptyEnrichment};
                    finalResponse.Domain= "";
                    console.log(finalResponse);
                    output.push(finalResponse);
                    }
                    continue;
                }
                let enrichedCompany = await makeValueSerp(link);
                let enrichedResponse;
                if(enrichedCompany) {
                  enrichedResponse = JSON.stringify(enrichedCompany.data);
                }else{
                  for(let mem=0; mem<Object.keys(responses[0]["Plans"]["data"]).length; mem++){
                    let plans =[];
                    plans["Account"] = responses[0]["Account"];
                    plans["Primary Trigger"] = responses[0]["Primary Trigger"];
                    plans["Secondary Trigger"] = responses[0]["Plans"]["data"][mem]["Secondary Trigger"];
                    plans["Source"] = responses[0]["Plans"]["data"][mem]["Source"];
                    plans["Confidence"] = responses[0]["Plans"]["data"][mem]["Confidence"];
                    plans["Source website"] = serpLinkJson[index].Link;
                    response.push(plans);
                    let finalResponse = {...response[mem], ...emptyEnrichment};
                    finalResponse.Domain= link;
                    console.log(finalResponse);
                    output.push(finalResponse);
                    }
                    continue;
                }
              enrichedResponse = JSON.parse(enrichedResponse);
              replaceKey(enrichedResponse, "employees", "Size");
              replaceKey(enrichedResponse, "location", "Geo");
              replaceKey(enrichedResponse, "industry", "Industry");
              replaceKey(enrichedResponse, "keywords", "Specialization");
              replaceKey(enrichedResponse, "growthFinal", "Growth");
              for(let mem=0; mem<Object.keys(responses[0]["Plans"]["data"]).length; mem++){
                let plans =[];
                    plans["Account"] = responses[0]["Account"];
                    plans["Primary Trigger"] = responses[0]["Primary Trigger"];
                    plans["Secondary Trigger"] = responses[0]["Plans"]["data"][mem]["Secondary Trigger"];
                    plans["Source"] = responses[0]["Plans"]["data"][mem]["Source"];
                    plans["Confidence"] = responses[0]["Plans"]["data"][mem]["Confidence"];
                    plans["Source website"] = serpLinkJson[index].Link;
                    response.push(plans);
                let finalResponse = {...response[mem], ...enrichedResponse};
                finalResponse.Domain= link;
                console.log(finalResponse);
                output.push(finalResponse);
              }

            } catch (error) {
                console.error(`Error scraping ${serpLinkJson[index].Link}:`, error.message);
            }
        }
        let introResult = output;
        console.log(introResult);
        const csvData = Papa.unparse(introResult);
        await downloadCSVFile(csvData, filename);

        statusEl.textContent = `file downloaded`;
        btn.removeAttribute("disabled");
        btn.textContent = "Start";
    } catch (error) {
        //
        statusEl.textContent = `Error - please try again!`;
        btn.removeAttribute("disabled");
        btn.textContent = "Start";
        console.error('Error saving settings:', error.message);
    }
}

async function downloadCSVFile(csvData, filename = "chatgptScrape") {
  try {
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${filename}.csv`;
      downloadLink.click();
  } catch (error) {
      console.error("Error downloading csv file:", error);
  }
}

async function callSerpAPI(query, token, numResults=1, timeline="lastMonth") {

  const res = [];
  let timeL = '';
  if (timeline === "lastWeek") {
      timeL = "now+7-d"
  }
  if (timeline === "lastMonth") {
      timeL = "today+1-m"
  }
  if (timeline === "last3Months") {
      timeL = `today+3-m`
  }

  const url = "https://aux-feature-dot-main-project-02.uc.r.appspot.com/api/utils/serp";

  const currentNum = numResults;
  const currentPage = 0;

  const params = new URLSearchParams({
      query: query,
      num: String(currentNum),
      page: String(currentPage),
      time_period: timeL
  });

  const options = {
      method: "POST",
      headers: {
          'Content-Type': 'application/json',
          'token': token
      }
  };

  try {
      const response = await fetch(`${url}?${params.toString()}`, options);
      const data = await response.json();
      if (data && data.organic_results && data.organic_results.length > 0) {
        res.push(data);
      } else {
          throw new Error(`NO Serp Results found for the ${query} query`);
      }
  } catch (error) {
      console.error("Error fetching data from API:", error.message);
      return [];
  }
  return res;
}


function extractSerp(results){
  // result = JSON.stringify(SerpResponse);
  if(results.length === 0){
    return [results, 0];
  }
  // let links = results.map(result => result.organic_results.map(entry => entry.link));
  let links = results.flatMap(result => result.organic_results.map(entry => entry.link));
  let titles = results.flatMap(result => result.organic_results.map(entry => entry.title));
  let serpLinkJson = [];
  let serpTitleJson = [];

  links.forEach((title, index) => {
    serpLinkJson.push({ Link: links[index] });
    serpTitleJson.push({ Title: titles[index] });
  });
  
  return [results, serpLinkJson, serpTitleJson];
}


async function callScrapeAPI(url, token) {
  const apiUrl = "https://aux.staging.glowradius.com/api/utils/scrape";
  
  const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token
    },
      body: JSON.stringify({ "url": url }),
      redirect: "follow"
  };

  try {
      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();
      return result.data;
      // console.log(result); // Log or return the result as needed
  } catch (error) {
      console.error(`Error fetching data from scrape API for ${url}`, error.message);
  }
}


async function formatResult(html, token) {

  const raw = JSON.stringify({
    "html": html
  });
  const compressedData = pako.deflate(raw);

  const requestOptions = {
    method: "POST",
    headers: {
      'Content-Type': 'application/octet-stream', 
      "token" : token
  },
    body: compressedData,
    redirect: "follow"
  };

  try {
    const response = await fetch("https://aux.staging.glowradius.com/api/utils/process-web-scrape", requestOptions);
    const results = await response.json();
    return results;
} catch (error) {
    console.error("Error fetching data from web Scrape API:", error);
    throw error;
}
}

function rawformat(){
  return "Please generate a JSON Array object with the following structure:" + 
    generateOutputFormatPrompt([
    {
     "name": "Account",
     "type": "string",
     "desc": "Name of the Company"
   },
    {
     "name": "Primary Trigger",
     "type": "string",
     "desc": "funding value and latest Round of the company, if not found set value to NA"
   },
   {
      "name": "Plans",
      "type": "JSON Object",
      "desc": `${(generateOutputFormatPrompt([
        {   
          "name": "Secondary Trigger",
          "type": "string",
          "desc": "One of the plans of the company provided in the list above, if not found set value to NA"
        },
        {
          "name": "Source",
          "type": "string",
          "desc": "Exact Quoting of text from News provided to support your response for this Particular Plan You Choosed."
        },
        {
          "name": "Confidence",
          "type": "Low/Medium/High",  
          "desc": "If very explicitly mentioned then High, or set it to Medium or Low based on Inference."
        } 
    ]))}, Details like Secondary Trigger(Name), Source and Confidence of each possible plan as different objects inside this key.`
   }
   ]);
}

function generateOutputFormatPrompt(outputExtraction) {
  const jsonStructure = outputExtraction.reduce((acc, { name, type, desc }) => {
      acc[name] = type;
      return acc;
  }, {});
  const details = outputExtraction.map(({name, type, desc}) => {
      return `- "${name}": ${desc}`;
  }).join('\n');

  const prompt = `
${JSON.stringify({ data: [jsonStructure] }, null, 2)}

Here are the details for each field:
${details}`;

  return prompt;
}

async function getOpenAIResponse(prompt, token) {
  const url = "https://aux.staging.glowradius.com/api/utils/gpt";
  const payload = { prompt };
  const options = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'token': token
      },
      body: JSON.stringify(payload)
  };

  try {
      const response = await fetch(url, options);
      const results = await response.json();
      return results.data;
  } catch (error) {
      console.error("Error fetching data from OpenAI API:", error);
      throw error;
  }
}

async function getCompanyDomain(CompanyName, token){
  try {
    let results = await callSerpAPI(`${CompanyName} startup website`, token);
    if(results.length === 0){
      throw error(`NO Serp Results found for ${CompanyName}`);
    }
    let links = results.flatMap(result => result.organic_results.map(entry => entry.link));
    let serpLinkJson = [];
    serpLinkJson.push(links[0]);
    const CleanedUrl = (serpLinkJson) => {
      // Ensure serpLinkJson is an array and has at least one element
      if (!Array.isArray(serpLinkJson) || serpLinkJson.length === 0) {
        return null;
      }
    
      const urlString = String(serpLinkJson[0]);
      const domainPattern = /^(?:https?:\/\/)?(?:www\.)?([^\/:?#]+)(?:[\/:?#]|$)/i;
      const match = urlString.match(domainPattern);
    
      if (match && match[1]) {
        const hostname = match[1];
        const parts = hostname.split('.');
        if (parts.length > 2) {
          return parts.slice(-2).join('.');
        }
        return hostname;
      }
    
      return null;
    };

    return CleanedUrl(serpLinkJson);
  }
  catch(error){
    console.error("Error in extracting Url of Company", error);
  }
}

async function generateToken() {
  try {
      const response = await axios.post('https://aux.staging.glowradius.com/generate-token');
      return response.data.token;
  } catch (error) {
      console.error('Error generating token:', error);
      throw error;
  }
}

async function makeValueSerp(url) {
  try {
      const serpResponse = await fetch(`https://api.valueserp.com/search?api_key=A520F5B3A39B4412B7C6E8140AB545EF&q=site:apollo.io/companies%20"${url}"&location=United%20States&google_domain=google.com&gl=us&hl=en&num=1&page=1`,
          {
              method: "GET",
              headers: {
                  "Content-Type": "application/json",
              },
          })
      const serpData = await serpResponse.json();
      if (serpData && serpData.organic_results && serpData.organic_results.length>0){
        const companyProfileLink = serpData.organic_results[0].link;
          try {
              const auxAccessToken = await generateToken();
              const response = await axios.get(`https://api-broker-dot-main-project-data.uc.r.appspot.com/apollo-scrape-profile?url=${companyProfileLink}`,{
                headers:{authorization:auxAccessToken}
              });
              return response.data;
          } catch (error) {
              console.error(`Error fetching the enriched data for ${url}`, error);
          }
      }else{
        throw new Error(`serpData for Company enrichment not found for ${url}`);

      }
  } catch (error) {
      console.error(`Error processing ${url}: ${error}`);
      return null;
  }
}


const generateSerpNumArray = n => n <= 100 ? [n] : Array.from({ length: Math.floor(n / 100) }, () => 100).concat(n % 100 !== 0 ? [n % 100] : []);
const handleSubmit = () => {
  saveSettings()
};

  return (
    <div className={classes.container}>
      <h3>ChatGpt Internal Ext - GR</h3>
      <form>
        <div className={classes.formControl}>
          <TextField
            id="filename"
            label="Filename"
            variant="outlined"
            placeholder="Enter filename"
            fullWidth
            value={formData.filename}
            onChange={handleChange}
          />
        </div>
        <div className={classes.formControl}>
          <TextField
            id="serpQuery"
            label="Serp Query"
            variant="outlined"
            placeholder="Enter serp query"
            fullWidth
            value={formData.serpQuery}
            onChange={handleChange}
          />
        </div>
        <div className={classes.formControl}>
          <TextField
            id="token"
            label="Token"
            variant="outlined"
            placeholder="Enter Token for Serp"
            fullWidth
            value={formData.token}
            onChange={handleChange}
          />
        </div>
        <div className={classes.formControl}>
          <TextField
            id="numResults"
            label="Number of Results"
            variant="outlined"
            type="number"
            placeholder="Enter number of results"
            fullWidth
            value={formData.numResults}
            onChange={handleChange}
          />
        </div>
            <div className={classes.formControl}>
            <InputLabel style={{marginBottom:'5px'}} id="resultTimeline-label">Result Timeline</InputLabel>
            <Select
              id="resultTimeline"
              value={formData.resultTimeline}
              onChange={handleSelectChange}
              fullWidth
              variant="outlined"
              labelId="resultTimeline-label"
            >
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="last3Months">Last 3 Months</MenuItem>
            </Select>
          </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={handleSubmit}
          id='startBtn'
        >
          Save
        </Button>
        <p id="status" className="text-muted mt-2"></p>
      </form>
    </div>
  );
};


export default Detailbook;