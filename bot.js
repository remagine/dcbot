"use strict"

const phantom = require('phantom');
const debug = console.log;

const timeout = ms => new Promise(res => setTimeout(res, ms))

var account = '3.14';
var password = '3.14!';

// 셀렉터 대기
async function waitForSelector(page, selector, timeOutMillis) {
    return new Promise((res)=>{  
        var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000;
        var start = new Date().getTime();

        var timer = setInterval(async ()=>{
            if (new Date().getTime() - start >= maxtimeOutMillis) {
                debug("'waitFor()' timeout");
                clearTimeout(timer);
                res(false);
            }                       

            var ret = await page.evaluate(function (selector) {
                return document.querySelectorAll(selector).length;
            }, selector);
            
            
            if (ret) {
                clearTimeout(timer);
                res(true);
            }
        }, 250);
    });
}

// 로그인
async function dc_login(page) {
    debug('--dc_login');
    var url = 'https://dcid.dcinside.com/join/login.php';
    const status = await page.open(url);
    var ret = false;

    ret = await waitForSelector(page, '#id');

    if (!ret) return false;

    await page.evaluate(function (account, password) {
        var form = document.login;
        form.user_id.value = account;
        form.pw.value = password;
        document.login.submit();
    }, account, password);

    ret = await waitForSelector(page, '.login');

    if (!ret) {
        debug('login timeout!');
    }    

    if (!ret) return false;

    return true;
}

// 글작성
async function dc_writer(page, gall, subject, memo) {
    debug('--dc_writer');
    var url = 'http://gall.dcinside.com/mgallery/board/write/?id='+gall;
    const status = await page.open(url);
    var ret = false;

    debug('status :', status);        

    ret = await waitForSelector(page, '.write');
    var count = page.framesCount;
    debug('count : ', count);
    
    if (!ret) {
        return 'dc_writer : timeout';
    }

    /*
    ret = await page.evaluate(function (selector) {
        return document.querySelectorAll(selector).length;
    }, '#name');    

    if (ret) {
        return 'dc_writer : logout';
    }
    */

    await page.evaluate(function (subject, memo) {
        var form = document.getElementById('write');
        

        document.getElementById('name').value = '3.14';
        document.getElementById('password').value = '3.14';
        document.getElementById('subject').value = subject;
        //document.querySelector('.tx-content-container p').innerHTML = memo;    
        //document.write.submit();

        //write_submit();
    }, subject, memo);

    page.switchToFrame(1);
    await page.render('write.png')
    await page.evaluate(function ( memo) {        
        console.log('iframe');
        //document.querySelector('.tx-content-container p').innerHTML = memo;    
        document.write.submit();

        //write_submit();
    },  memo);

    await timeout(3000);

    //await page.render('write.png')

    return 'write';
}

// 메인루프
(async ()=>{
    const instance = await phantom.create();

    try {
        var ret = false;

        var page = await instance.createPage();
        ret = await dc_login(page);
        if (!ret) {
            debug('login fail');
            throw new Error('login fail');
        }
        
        await page.close();

        var running = true;
        while (running) {
            debug('--running');
            page = await instance.createPage();               

            var gallid = 'tenbagger';
            var subject = '테스트용';
            var memo = '<img src="https://i.esdrop.com/d/S749eRuDrr.jpg">';

            var ret = await dc_writer(page, gallid, subject, memo);
            debug(ret);
            if (ret=='write') {
                // 성공
                console.log('write success');
            }

            await page.close();
            await timeout(60 * 60 * 1000); //한시간 대기
        }

        debug('--end');
    } catch(e) {
        debug(e);
    }

    await instance.exit();
})();