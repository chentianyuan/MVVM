function mvvm(options){
    var self = this
    // 初始化mvvm将对象绑定到新的mvvm实例上
    this.data = options.data
    this.methods = options.methods
    // 为了以vm.xx的形式访问,再包一层代理，每次访问mvvm实例上的属性时，都返回mvvm实例data的属性
    Object.keys(this.data).forEach(function(key){
        self.proxyKeys(key)
    })

    // 监听data的同时
    observer(this.data)
    // new Fn()
    // 初始化视图,添加watcher都在compile中操作了
    new Compile(options.el,this)
    // el.innerHTML = this.data[exp] // 初始化模板值
    // 创建了订阅者，exp是被订阅的属性名，新建mvvm实例时传入，function是cb
    // new watcher(this, exp, function(value){
    //     // 回调用于更新视图
    //     el.innerHTML = value
    //     console.log('aaaaa')
    // })
}

mvvm.prototype = {
    proxyKeys: function(key){
        var self = this
        // 对mvvm实例劫持获取mvvm.data返回mvvm.data.data
        Object.defineProperty(this, key, {
            enumerable: false, // 不可枚举
            configurable: true, // 可删除
            get: function getter() {
                return self.data[key]
            },
            set: function setter(newVal) {
                self.data[key] = newVal
            }
        });
    }
}