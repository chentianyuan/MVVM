function Watcher(vm,exp,cb){
    this.cb = cb // 数据更新后要做的事情
    this.vm = vm // 被订阅的数据来自当前的vue实例
    this.exp = exp // 被订阅的属性名
    // this.get()等于触发了属性的get函数，将自己添加到订阅器，并且get函数返回了改属性
    // 只有这个地方才会触发添加监视器的操作，如果没有Dep.target这个变量，每次获取值的时候都会添加该值重复的一个监听器
    this.value = this.get()
}

Watcher.prototype = {
    update: function(){
        this.run() // 属性值变化收到通知
    },
    run: function(){
        // 数据改变时
        var value = this.vm.data[this.exp] // 取到最新的值 || this.get()
        var oldVal = this.value // 存储老值
        if(value !== oldVal){
            this.value = value
            this.cb.call(this.vm,value,oldVal) // 执行compile中的回调,更新视图
        }
    },
    get: function(){
        // 先给Dep.target设为watcher
        // 将当前订阅者指向自己
        Dep.target = this 
        // 强制触发
        var value = this.vm.data[this.exp]
        // 新的值设定完毕后清除Dep.target
        Dep.target = null
        return value
    }
}