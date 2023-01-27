const url = "https://www.youtube.com/playlist?list=PLRBp0Fe2GpgnIh0AiYKh7o7HnYAej-5ph"

const PDFDocument = require('pdfkit');
const fs = require('fs');
const pptr = require('puppeteer');


const options = {
    headless : false,
    args :["--start-maximized"],
    defaultViewport : null
};

(async function(){
    try{
        //open browser and search the url
        let browserContextObjPromise = await pptr.launch(options)
        let page = await browserContextObjPromise.pages();
        page = page[0]
        await page.goto(url)


        await page.waitForSelector(".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-20.overflown")
        let nameOfPlaylist = await page.$eval(".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-20.overflown",el=>el.textContent);
        let data = await page.evaluate(getElementData,'.byline-item.style-scope.ytd-playlist-byline-renderer')
        console.log(`${nameOfPlaylist}\n${data.noOfVideos}\n${data.noOfViews}`)
        let totalVideos = data.noOfVideos.split(" ")[0];
        totalVideos = parseInt(totalVideos.replace(',',''))
        console.log(totalVideos)

        let currentVideoLength = await currVideoLength(page)
        console.log(currentVideoLength)

        while(totalVideos - currentVideoLength >= 10){
            await scrollToBottom(page);
            currentVideoLength += await currVideoLength(page)
            console.log(currentVideoLength)

        }

        console.log("scrolling done")
        let lit = await list(page)
         console.log(lit)

        let pdfDoc = new PDFDocument;
        pdfDoc.pipe(fs.createWriteStream('Playlist data.pdf'));
        pdfDoc.text(JSON.stringify(lit));
        pdfDoc.end();

    }catch(err){
        console.log(err);
    }
})();


async function currVideoLength(page){
    let l = await page.evaluate(Length,"#primary #contents #contents #contents .style-scope.ytd-playlist-video-list-renderer")
    return l;
}

async function scrollToBottom(page){
    await page.evaluate(gotobottom)
    function gotobottom(){
        window.scrollBy(0,window.innerHeight)
    }
}

async function list(page){
    let lt = page.evaluate(arrayList,"#primary #contents #contents #contents .style-scope.ytd-playlist-video-list-renderer .yt-simple-endpoint.style-scope.ytd-playlist-video-renderer","#primary #contents #contents #contents .style-scope.ytd-playlist-video-list-renderer span.style-scope.ytd-thumbnail-overlay-time-status-renderer")
    return lt;
}

function getElementData(selector){
    let data = document.querySelectorAll(selector);
    let noOfVideos = data[0].innerText;
    let noOfViews = data[1].innerText;
    return{
        noOfVideos,
        noOfViews
    }
}

function Length(selector){
    let len = document.querySelectorAll(selector)
    return len.length;
}

function arrayList(titleSelector,durationSelector){
    let titles = document.querySelectorAll(titleSelector)
    let durations = document.querySelectorAll(durationSelector)

    let list = []
    for(let i = 0;i < durations.length;i++){
        let title = titles[i].innerText;
        let duration = durations[i].innerText

        list.push({title,duration})
    }
    return list
}