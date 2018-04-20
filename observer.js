// 监听器主要是基于Object.defineProperty的set方法,每当data被重新设置时就会触发set的方法
// 数据劫持的核心
function observer(value){
    if(!value || typeof value !== 'object'){
        // observe监听对象的子属性，若不是对象，则已经最后一层，不用监听
        return
    }
    // reactive对data中的每个属性进行监听
    // Object.entries(data).forEach(value => {
    //     // value[0]是键值，value[1]是属性值，data是整体对象
    //     defineReactive(data,value[0],value[1])
    // });
    return new Observer(value)
}

function Observer(data){
    this.data = data
    this.walk(data)
}

Observer.prototype = {
    walk(data){
        var self = this;
        Object.keys(data).forEach(function(key) {
            self.defineReactive(data, key, data[key]);
        });
    },
    defineReactive(data,key,val){
    // data每有一个key,则为这个key的属性新建一个dep,dep内存储着这个key的所有订阅者的数组
    var dep = new Dep()
    // 防止有多层嵌套,继续向下订阅，每有一个新的属性就新增一个订阅者
    observer(val)
    // 重写data
    Object.defineProperty(data,key,{
        enumerable: true, // 可枚举，可被Object.value()等遍历方法所遍历
        configurable: true, // 可再重新定义，即可被修改，可被删除, 默认为false
        get: function(){
            // console.log(Dep.target)
            // Dep.target现在其实为null,但是在watcher.js中每次get都将watch自身添加到全局的Dep.target中
            // 等到value获取完毕,再将Dep.target清空
            // Dep.target作为闭包,在函数中保持了dep的存在
            // 如果没有Dep.target,dep会被清除,在set中就无法通过dep.nptify()来出发watcher了
            // Dep.target && dep.addSub(Dep.target)
            if(Dep.target){
                dep.addSub(Dep.target) // 添加一个订阅者
            }
            return val
        },
        set: function(newVal){
            console.log('值变化')
            if(newVal === val) return
            val = newVal
            // 通知所有订阅者
            dep.notify()
        }
    })
}
}



function Dep(){
    this.subs = []
}
// 属性写在构造函数中,共享的函数写在原型上
Dep.prototype = {
    // 添加订阅者的方法
    addSub: function(sub){
        this.subs.push(sub)
    },
    notify: function(){
        // 通知所有的订阅者
        this.subs.forEach(sub=>{
            // 这里保存的sub都是单独的watcher对象
            sub.update()
        })
    }
}

// Dep初始值
Dep.target = null