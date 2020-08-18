// 用对象收编变量的思想

var bird = {
    // 添加这些属性到对象中，减少对dom的请求
    // 例如要对 sky背景的background-position-x修改，不必每次都对dom元素操作取值
    skyPosition: 0,
    skyStep: 2, // 控制天空背景移动的速度 2为初始未开始的速度
    birdTop: 235, // bird 元素初始的高度位置
    // birdX: 0, // birdx 雪碧图的初始位置 用于后期扇动翅膀 
    stratColor: 'white',
    startFlag: false, // 判断游戏是否开始，初始未开始时是 false
    birdSetpY: 0, // 小鸟 加速 降落事件中的初始步长
    minTop: 0, // 小鸟活动范围的边界（上界）
    maxTop: 570, // 小鸟活动范围的边界（下界） 600 - 30 
    timer: null,
    pipeLength: 7, // 想生成的柱子的个数
    pipeArr: [],
    pipeLastIndex: 6, // 最后一根柱子的索引
    score: 0,
    scoreArr: [],

    init: function () {
        this.initData();
        this.animate();
        this.handleStart();
        this.handleClick();
        this.handleReStart();

        if (getSession('play')) {
            this.start();
        }
    },

    // 初始化函数
    initData: function () {
        // 使用this 使得bird内的成员均可以使用下面的属性
        this.el = document.getElementById('game');
        this.oBird = this.el.getElementsByClassName('bird')[0];
        this.oStart = this.el.getElementsByClassName('start')[0];
        this.oScore = this.el.getElementsByClassName('score')[0];
        this.oMask = this.el.getElementsByClassName('mask')[0];
        this.oEnd = this.el.getElementsByClassName('end')[0];
        this.oFinalScore = this.oEnd.getElementsByClassName('final-score')[0];
        this.oRankList = this.el.getElementsByClassName('rank-list')[0];
        this.oReStart = this.el.getElementsByClassName('restart')[0];

        this.scoreArr = this.getScore();
        // console.log(this.scoreArr);
    },

    // 获取Local Storage 中的数据
    getScore: function () {
        var scoreArr = getLocal('score');
        // 防止获取的是 null 无法进行push
        return scoreArr ? scoreArr : [];

    },

    // 运动函数
    animate: function () {
        // 减少整个JS文件中定时器的使用次数，将skyMove birdJump等事件放入animate 函数的定时器中一同运动
        var self = this;
        var count = 0;
        this.timer = setInterval(function () {
            self.skyMove();
            // 游戏开始
            if (self.startFlag) {
                self.bridDrop();
                self.pipeMove();
            }
            if (++count % 10 === 0) {
                // 游戏未开始
                if (!self.startFlag) {
                    self.startBound();
                    self.birdJump();
                }
                self.birdFly(count);
            }
        }, 30);
    },

    // 天空背景运动函数
    skyMove: function () {
        // setInterval 内的回调函数 中的this 指向 指向的是window  因此 要更改this指向
        // 或者使用ES6 的箭头函数
        // var self = this;
        // setInterval(function () {
        //     // 考虑长远点，当我们的天空背景如果运动的速度更改，应该如果操作
        //     // self.skyPosition -= 2;
        //     // 使用变量进行改变
        //     self.skyPosition -= self.skyStep;
        //     self.el.style.backgroundPositionX = self.skyPosition + 'px';
        // }, 30)

        // 上述的注释是未来减少 定时器的使用 因此 skyMove 只写事件处理
        this.skyPosition -= this.skyStep;
        this.el.style.backgroundPositionX = this.skyPosition + 'px';
    },

    // 开始之前小鸟的跳动（上下跳动）
    birdJump: function () {
        this.birdTop = this.birdTop === 220 ? 260 : 220;
        this.oBird.style.top = this.birdTop + 'px';
    },

    // 小鸟扇动翅膀 小鸟fly
    birdFly: function (count) {
        // this.birdX -= 30;
        // 使用计数器，count，使得其能与上述表达式达到一样效果，减少变量的使用
        this.oBird.style.backgroundPositionX = count % 3 * -30 + 'px';
    },

    // 开始游戏之后，不点击鼠标事件，小鸟自由落下(加速降落)
    bridDrop: function () {
        // this.oBird.style.top = 
        this.birdTop += ++this.birdSetpY;
        this.oBird.style.top = this.birdTop + 'px';
        this.judgeKnoke();
        this.addScore();
    },

    // 分数累加
    addScore: function () {
        var index = this.score % this.pipeLength;
        var pipeX = this.pipeArr[index].up.offsetLeft;
        if (pipeX < 13) { // 13 柱子正好越过小鸟的距离
            // this.score++;
            this.oScore.innerText = ++this.score;
        }
    },

    // 判断是否撞天 or 地 or 柱子
    judgeKnoke: function () {
        // 判断是否撞到边界
        this.judgeBoundary();
        // 判断是否撞到柱子
        this.judgePipe();
    },

    // 判断 撞到边界的函数
    judgeBoundary: function () {
        if (this.birdTop <= this.minTop || this.birdTop >= this.maxTop) {
            this.failGame();
        }
    },

    // 判断 是否撞到柱子
    judgePipe: function () {
        // 柱子数组下标索引
        var index = this.score % this.pipeLength;
        var pipeX = this.pipeArr[index].up.offsetLeft;
        var pipeY = this.pipeArr[index].y; // []
        var birdY = this.birdTop;

        if ((pipeX <= 95 && pipeX >= 13) && (birdY <= pipeY[0] || birdY >= pipeY[1])) {
            this.failGame();
        }
    },

    // 生成柱子
    createPipe: function (x) {
        // 上下柱子之间的距离相等 150 px
        // 所以上下柱子的长度最合理的范围是 （600 - 150）/2 = 225
        // 控制范围在50~175

        // var upHeight = 50 + Math.floor(Math.random() * 175);
        // var downHeight = 450 - upHeight;
        // var oDiv = document.createElement('div');
        // oDiv.classList.add('pipe');
        // oDiv.classList.add('pipe-up');
        // oDiv.style.height = upHeight + 'px';
        // oDiv.style.left = x + 'px';
        // this.el.appendChild(oDiv);

        // var oDiv1 = document.createElement('div');
        // oDiv1.classList.add('pipe');
        // oDiv1.classList.add('pipe-down');
        // oDiv1.style.height = downHeight + 'px';
        // oDiv1.style.left = x + 'px'
        // this.el.appendChild(oDiv1);

        // 上述代码冗余太多，耦合度太高，需要进行封装一下

        var upHeight = 50 + Math.floor(Math.random() * 175);
        var downHeight = 450 - upHeight;
        // createEle函数存放在函数工具库 utils.js 中
        var oUpPipe = createEle('div', ['pipe', 'pipe-up'], {
            left: x + 'px',
            height: upHeight + 'px',
        });

        var oDownPipe = createEle('div', ['pipe', 'pipe-down'], {
            height: downHeight + 'px',
            left: x + 'px'
        });

        this.el.appendChild(oUpPipe);
        this.el.appendChild(oDownPipe);

        // 将柱子放在pipe函数中，方便后序的读取
        this.pipeArr.push({
            up: oUpPipe,
            down: oDownPipe,
            y: [upHeight, upHeight + 150 - 30] // 小鸟过柱子上下运动的安全距离
        })

    },

    // 柱子移动函数
    pipeMove: function () {
        for (var i = 0; i < this.pipeLength; i++) {
            var oUpPipe = this.pipeArr[i].up;
            var oDownPipe = this.pipeArr[i].down;
            // 使得 柱子和背景的运动速度一样
            var x = oUpPipe.offsetLeft - this.skyStep;


            if (x < -52) {
                // clearInterval(this.timer);
                var lastPipeLeft = this.pipeArr[this.pipeLastIndex].up.offsetLeft;
                oUpPipe.style.left = lastPipeLeft + 300 + 'px';
                oDownPipe.style.left = lastPipeLeft + 300 + 'px';
                // 改变最后一个柱子的索引值，将柱子可以连续移动
                this.pipeLastIndex = i;
                continue;
            }
            oUpPipe.style.left = x + 'px';
            oDownPipe.style.left = x + 'px';
        }
    },

    // '开始游戏' 这四个字 放大缩小
    startBound: function () {
        // 将之前的颜色保存到变量中
        var prevColor = this.stratColor;
        this.stratColor = this.stratColor === 'blue' ? 'white' : 'blue';
        this.oStart.classList.remove('start-' + prevColor);
        this.oStart.classList.add('start-' + this.stratColor);
    },

    // 监听 Start 的事件函数
    handleStart: function () {
        this.oStart.onclick = this.start.bind(this);
    },
    start: function () {
        var self = this;
        self.oScore.style.display = 'block';
        self.oStart.style.display = 'none';
        self.skyStep = 5;
        // 点击游戏开始，游戏上锁
        self.startFlag = true;

        self.oBird.style.left = '80px';
        // 让小鸟元素 更改top值时候的 过渡效果取消
        self.oBird.style.transition = 'none';

        for (var i = 1; i <= self.pipeLength; i++) {
            self.createPipe(300 * i);
        }
    },
    // 监听父元素 被点击的事件 控制小鸟往上飞
    handleClick: function () {
        var self = this;
        this.el.onclick = function (e) {
            var dom = e.target;
            // 事件委托，当事件源对象为 start‘开始游戏’时候，小鸟不往上飞10px
            var isStart = dom.classList.contains('start');
            if (!isStart) {
                self.birdSetpY = -10;
            }
        }
    },

    // 重新开始点击事件
    handleReStart: function () {
        this.oReStart.onclick = function () {
            // 不能用local storage 来判断是否玩过游戏
            // 如果玩过游戏，点重新开始，直接进入游戏
            // 如果没玩过游戏，进入开始页面，需要点击开始游戏
            setSession('play', true);
            window.location.reload();
        }
    },

    // 游戏结束函数
    failGame: function () {
        // console.log('end');
        clearInterval(this.timer);
        this.setScore();
        this.oMask.style.display = 'block';
        this.oEnd.style.display = 'block';
        this.oScore.style.display = 'none';
        this.oBird.style.display = 'none';
        this.oFinalScore.innerText = this.score;
        this.renderRankList();
    },

    // 结束时候设置分数，并将分数保存到Local Storage
    setScore: function () {
        this.scoreArr.push({
            score: this.score,
            time: this.getDate(),
        })
        this.scoreArr.sort(function (a, b) {
            return b.score - a.score;
        })
        var scoreLength = this.scoreArr.length;
        this.scoreArr.length = scoreLength > 8 ? 8 : scoreLength;
        setLocal('score', this.scoreArr);
    },

    // 获取时间信息
    getDate: function () {
        var d = new Date();
        var year = d.getFullYear();
        var month = formatNum(d.getMonth() + 1);
        var day = formatNum(d.getDate());
        var hour = formatNum(d.getHours());
        var minute = formatNum(d.getMinutes());
        var second = formatNum(d.getSeconds());
        return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
    },


    // 设置排行榜列表
    renderRankList: function () {
        var template = '';
        for (var i = 0; i < this.scoreArr.length; i++) {
            var degreeClass = '';
            switch (i) {
                case 0:
                    degreeClass = 'first';
                    break;
                case 1:
                    degreeClass = 'second';
                    break;
                case 2:
                    degreeClass = 'third';
                    break;
                default:
                    break;
            }
            template += `
            <li class="rank-item">
                <span class = "rank-degree ${degreeClass}">${i + 1}</span>
                <span class = "rank-score">${this.scoreArr[i].score}</span> 
                <span class = "rank-time">${this.scoreArr[i].time}</span> 
            </li>
            `;
        }
        this.oRankList.innerHTML = template;
    },
}
bird.init();