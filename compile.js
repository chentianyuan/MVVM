
// 因为所有的节点会被一次插入到文档中，而这个操作仅发生一个重渲染的操作，而不是每个节点分别被插入到文档中，因为后者会发生多次重渲染的操作
// 多次操作dom，创建DocumentFragment，只引发一次重绘
function Compile(el,vm){
    this.vm = vm // 存储mvvm实例
    this.el = document.querySelector(el) // 获取要编译的模板
    this.fragment = null // 创建文档片段
    this.init() // 初始化
}

Compile.prototype = {
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
    },
    compile(node){
        var nodeAttrs = node.attributes
        // var self = this
        Array.prototype.forEach.call(nodeAttrs,(attr)=>{
            var attrName = attr.name
            // 遍历每个属性，如果在我们的指令系统中
            if(this.isDirective(attrName)){
                // 事件指令
                // 绑定的属性名
                var exp = attr.value
                // 取出v-后面的字符
                var dir = attrName.substring(2)
                if(this.isEventDirective(dir)){
                    this.compileEvent(node,this.vm,exp,dir)
                }else{ 
                    // v-model指令单独操作
                    this.compileModel(node,this.vm,exp,dir)
                }
            }
            // 绑定后移除
            node.removeAttribute(attrName)
        })
    },
    compileText(node,exp){
        // 双括号编译函数
        var self = this
        var initText = this.vm[exp]
        // 初始化innerHTM
        this.updateText(node, initText)
        // 新建订阅者，订阅{{}}的内容
        new Watcher(this.vm, exp, function (value) {
            // cb内容更改指定回调
            self.updateText(node, value)
        })
    },
    compileEvent: function (node, vm, exp, dir) {
        // 绑定事件
        var eventType = dir.split(':')[1];
        // vm.methods必须存在，并将其赋值给cb之后绑定到mvvm实例上
        var cb = vm.methods && vm.methods[exp];
        // 将事件绑定至指定节点
        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);
        }
    },
    compileModel: function (node, vm, exp, dir) {
        var self = this
        var val = this.vm[exp]
        this.modelUpdater(node, val)
        // 添加订阅者
        new Watcher(this.vm, exp, function (value) {
            self.modelUpdater(node, value)
        });

        // 视图改变数据，监听即可
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            self.vm[exp] = newValue;
            val = newValue;
        });
    },
    updateText(node,value){
        // 更新非undefined的更新后的值
        node.textContent = typeof value == 'undefined' ? '' : value
    },
    modelUpdater(node,value,oldValue){
        // 不同于双大括号
        node.value = typeof value == 'undefined' ? '' : value
    },
    isDirective: function(attr) {
        // 是否是指令
        return attr.indexOf('v-') == 0;
    },
    isEventDirective: function(dir) {
        // 事件指令
        return dir.indexOf('on:') === 0;
    },
    isElementNode: function (node) {
        // 元素节点
        return node.nodeType == 1;
    },
    isTextNode: function(node) {
        // 文本节点
        return node.nodeType == 3;
    }
}