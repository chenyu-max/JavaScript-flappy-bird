// 存放工具函数  已经封装好的函数

function createEle(eleName, classArr, styleObj) {
    var dom = document.createElement(eleName);
    // 类名赋值
    for (var i = 0; i < classArr.length; i++) {
        dom.classList.add(classArr[i]);
    }
    // 属性赋值
    for (var key in styleObj) {
        dom.style[key] = styleObj[key];
    }
    return dom;
}


function setLocal(key, value) {
    if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
}

function getLocal(key) {
    var value = localStorage.getItem(key);
    if (value === null) {
        return null;
    }
    if (value[0] === '[' || value[0] === '{') {
        return JSON.parse(value);
    }
    return value;
}

function setSession(name, value) {
    sessionStorage.setItem(name, value);
};

function getSession(name) {
    return sessionStorage.getItem(name);
}

//  将个位数转为双位，如 8 变为 08
//  @param {Number|String} number - 要转换的数字

function formatNum(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}