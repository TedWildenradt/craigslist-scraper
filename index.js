const request = require('request-promise');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');

const url = 'https://sfbay.craigslist.org/search/sof'

const scrapeSample = {
  title: 'Junior Database Administrator',
  description: 'Long description about the position',
  datePosted: new Date('2019-03-21'),
  url: 'https://sfbay.craigslist.org/eby/sof/d/oakland-junior-database-administrator/6846922229.html',
  hood: 'oakland downtown',
  address: 'N/A',
  compensation: '45/hr'
}

const scrapeResults = [];

async function scrapeJobHeader() {
  try {
    const htmlResult = await request.get(url);
    const $ = await cheerio.load(htmlResult);

    $(".result-info").each((index,el) => {
      const resultTitle = $(el).children(".result-title");
      const hood = $(el).find(".result-hood").text().slice(2,-1);
      const datePosted = new Date($(el).children("time").attr("datetime"));
      const title = resultTitle.text()
      const url = resultTitle.attr("href");
      const scrapeResult = { title, url, datePosted, hood }
      scrapeResults.push(scrapeResult);
    })
    return scrapeResults;
  } catch (err) {
    console.log(err);
  }


}

async function scrapeDescription(jobsWithHeaders) {
  return await Promise.all(jobsWithHeaders.map( async job => {
    const htmlResult = await request.get(job.url);
    const $ = await cheerio.load(htmlResult);
    $(".print-qrcode-container").remove();
    job.description = $("#postingbody").text();
    job.address = $("div.mapaddress").text();
    const compensation = $(".attrgroup").children().first().text();
    compensation.replace("compensation: ","");
    job.compensation = compensation.replace("compensation: ","");
    return job;
  }))
}

async function scrapeCraigslist() {
  const jobsWithHeaders = await scrapeJobHeader();
  const jobsFullData = await scrapeDescription(jobsWithHeaders)
  console.log(jobsFullData);
  const csv = new ObjectsToCsv(jobsFullData);
  csv.toDisk('./csv_data.csv')
}

scrapeCraigslist();