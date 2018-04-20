![MVVM](https://upload-images.jianshu.io/upload_images/6870041-3170fc9946b7b556.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
### 简单地说就是数据驱动视图，视图改变(事件)也可以改变数据，就是双向绑定的概念。
### 实现
##### 为了监听数据的改变，从而响应到视图上，用的是Vue双向绑定的核心`Object.definePrototype(obj,key,{...})`，编写Observer.js来实现。若set被触发，通知所有的订阅者(dep中存储的是所有订阅者实例对象)，且在get中引入Dep.target，仅在添加watcher时主动赋值，防止之后多次添加watcher，并且get返回当前的val值。
```
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
```
##### 订阅者watcher.js关联着模板编译，每个生成的订阅者都包含一个修改模板的callback，一旦对应发布者Observer.js中的set函数执行，所有对应订阅者接收到通知，就会执行该订阅者被创建时包含的callback，修改视图。
```
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
    }
```

##### 在Vue中实现数据绑定有两种途径，一种是双大括号`{{}}`，一种是`v-model`，为了将数据绑定到页面，同时为了给包含这两种情况的模板添加**订阅者**，编写compile.js来实现。compile.js接收MVVM实例中挂载的根节点和该实例对象。先将所有节点**剪切**到fragment文档片段中，再通过遍历所有节点的方式，碰到包含数据绑定的节点，就创建一个新的watcher，并包含改变视图的callback从而与watcher.js关联，碰到其他类似事件绑定的节点，则给其绑定事件监听器，从而实现v-on的事件绑定效果。另外使用文档片段的好处是避免了页面的频繁的回流重绘，文档节点使用完毕后返回页面只需渲染一次即可。
核心代码
```
    init(){
        if(this.el){
            this.fragment = this.nodeToFragment(this.el) 
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        }
    },
    // 节点全部转为文档片段
    nodeToFragment(el){
        // 创建空的文档片段
        var fragment = document.createDocumentFragment()
        var child = el.firstChild
        while(child){
            // 子节点推入文档片段,appendChild会有剪切的效果！！！！！
            fragment.appendChild(child)
            child = el.firstChild
        }
        return fragment
    },
    compileElement(el){
        // 创建好的文档片段拿过来编译
        var childNodes = el.childNodes
        var self = this
        // dom数组不是真正的数组，没有遍历方法

        // 多层嵌套slice处理效率过低导致执行失效
        // [].slice.call(childNodes).forEach(function(node){})
        // 也好像不是？？？？在控制台测试了一下都运行的飞快啊...
        Array.prototype.forEach.call(childNodes,function(node){
            // 处理{{}}的正则
            var reg = /\{\{(.*)\}\}/
            var text = node.textContent

            if(self.isElementNode(node)){
                self.compile(node)
            }else if(self.isTextNode(node) && reg.test(text)){
                // 检测到双括号
                self.compileText(node,reg.exec(text)[1])
            }

            // 递归编译，编译所有节点
            if(node.childNodes && node.childNodes.length){
                self.compileElement(node)
            }
        })
    }
```
## 参考链接 
## [canfoo](https://github.com/canfoo/self-vue)