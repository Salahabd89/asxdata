
const puppeteer = require("puppeteer");
const _ = require("underscore");
const fs = require('fs');
//["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
const letters = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]




function leftJoin(left, right, left_id, right_id) {
    var result = [];
    _.each(left, function (litem) {
        var f = _.filter(right, function (ritem) {
            return ritem[right_id] == litem[left_id];
        });
        if (f.length == 0) {
            f = [{}];
        }
        _.each(f, function (i) {
            var newObj = {};
            _.each(litem, function (v, k) {
                newObj[k + "1"] = v;
            });
            _.each(i, function (v, k) {
                newObj[k + "2"] = v;
            });
            result.push(newObj);
        });
    });
    return result;
}

async function getPeople(ASX_Code, browser) {
    try {

        let page = await browser.newPage(); //open a new page

        const dbURL = "https://www.reuters.com/finance/stocks/company-officers/" + ASX_Code + ".AX"
        
        await page.goto(dbURL, { timeout: 30000000 });

        let result = await page.evaluate((ASX_Code) => {

            var result = []

            var people_table = document.querySelector("#companyNews > div > div.moduleBody > table")
            var people_count = document.querySelectorAll("#companyNews > div > div.moduleBody > table")[0].children[0].children.length
            var compensation_table = document.querySelectorAll("#companyNews > div > div.moduleBody > table > tbody")

            for (var i = 1; i < people_count; i++) {
                result.push({
                    name: people_table.children[0].children[i].children[0] == null ? '' : people_table.children[0].children[i].children[0].innerText,
                    age: people_table.children[0].children[i].children[1] == null ? '' : people_table.children[0].children[i].children[1].innerText,
                    since: people_table.children[0].children[i].children[2] == null ? '' : people_table.children[0].children[i].children[2].innerText,
                    position: people_table.children[0].children[i].children[3] == null ? '' : people_table.children[0].children[i].children[3].innerText,
                    compensation: compensation_table[2].children[i].children[1] == null ? '' : compensation_table[2].children[i].children[1].innerText,
                    asx: ASX_Code == null ? '' : ASX_Code
                })
            }



            return result
        }, ASX_Code)

        await page.close()
        return result

    } catch (error) {
        console.log(error);
    }
}

async function getASXCompanies(letter, browser) {
    try {
        let page = await browser.newPage(); //open a new page
        const dbURL = "https://www.asx.com.au/asx/research/listedCompanies.do?coName=" + letter
        await page.goto(dbURL, { timeout: 30000000 });

        let result = await page.evaluate(() => {

            var result = []

            var row = document.querySelectorAll("#content > div > table")[0].children[0].children

            arr = Array.from(row);
            arr.shift();
            arr.forEach(function (value) {


                c_name = value.childNodes[1]

                if (c_name != null && c_name != 'Company name') {
                    result.push({
                        company: value.childNodes[1].innerText,
                        ASX_Code: value.childNodes[3].innerText,
                        industry: value.childNodes[5].innerText,
                        link: value.childNodes[3].children[0].href
                    })
                }
            })
            return result
        })
        await page.close()
        return result
    } catch (error) {
        console.log(error);
    }
}

async function getCompanyDetails(url, browser) {

    const dbURL = url

    let page = await browser.newPage(); //open a new page


    try {
        page.on("pageerror", function (err) {
            theTempValue = err.toString();
            console.log("Page error: " + theTempValue);
        })
        await page.goto(dbURL, { timeout: 30000000 });
        let details = await page.evaluate(() => {

            result = []
            people = []
            detail = []

            website = document.querySelector("#information-column > div.view-content.ng-scope > div > table.table-people.company-details > tbody > tr:nth-child(6) > td")
            industry = document.querySelector("#information-column > div.view-content.ng-scope > div > table.table-people.company-details > tbody > tr:nth-child(4) > td")
            address = document.querySelector("#information-column > div.view-content.ng-scope > div > table.table-people.company-details > tbody > tr:nth-child(7) > td")
            phone = document.querySelector("#information-column > div.view-content.ng-scope > div > table.table-people.company-details > tbody > tr:nth-child(8) > td")
            asx = document.querySelector("#information-column > div.view-content.ng-scope > div > table.table-people.company-details > tbody > tr:nth-child(1) > td")
            positions_length = document.querySelectorAll("#information-column > div.view-content.ng-scope > div > table:nth-child(5)")[0].children[0].children.length

            // for (var i = 0; i < positions_length; i++) {

            // people.push({
            // name: document.querySelector("#information-column > div.view-content.ng-scope > div > table:nth-child(5)").children[0].children[i].children[0].innerText,
            // position: document.querySelector("#information-column > div.view-content.ng-scope > div > table:nth-child(5)").children[0].children[i].children[1].innerText,
            // asx: asx.innerText
            //})
            //}

            result.push({
                website: website == null ? '' : website.innerText,
                industry: industry == null ? '' : industry.innerText,
                address: address == null ? '' : address.innerText,
                phone: phone == null ? '' : phone.innerText,
                asx: asx.innerText
                //people: people
            })

            //people.forEach((itm, i) => {
            //detail.push(Object.assign({}, itm, result[i]));
            // });

            return result
        })

        return details
    } catch (error) {
        pageerror(error)
        await browser.close()
    }

    await page.close()

}

async function getcompanybyletter(letter, browser1) {

    all_c = []

    all_details = []


    var page = await getASXCompanies(letter, browser1)
    all_c.push(page)
    console.log("Main array length: " + all_c.length)


    console.log("closed browser 1")

    let browser2 = await puppeteer.launch({ headless: true });

    await browser1.close();

    var length = all_c.length
   
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < all_c[i].length; j++)
            try {
                let link = all_c[i][j].link + "/details"
                let ASX_Code = all_c[i][j].ASX_Code

                    console.log(j +"/" + length)
         
                    var page = await getCompanyDetails(link, browser2)
                    var peopleinfo = await getPeople(ASX_Code, browser2)
                    final_arr = leftJoin(peopleinfo, page, "asx", "asx");
                    all_details.push(final_arr)

            } catch (e) {  }
    }

    await browser2.close();

    console.log("closed browser 2")


    var csv_arr = []

    for (var i = 0; i < all_details.length; i++) {
        for (var j = 0; j < all_details[i].length; j++) {
            csv_arr.push(all_details[i][j])
        }
    }

    let csv = toCSV(csv_arr);

    console.log(csv);

    fs.writeFile("C:/Projects/file_"+ letter +".csv" , csv, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("The file was saved!");
    });

}

function toCSV(json) {
    json = Object.values(json);
    var csv = "";
    var keys = (json[0] && Object.keys(json[0])) || [];
    csv += keys.join('|') + '\n';
    for (var line of json) {
        csv += keys.map(key => line[key]).join('|') + '\n';
    }
    return csv;
}


async function getallcompanies(){

    
    
    for (var i = 0; i < letters.length; i++) {

        let browser1 = await puppeteer.launch({ headless: true });

        await getcompanybyletter(letters[i],browser1 );
    
    }
    

}

getallcompanies()
