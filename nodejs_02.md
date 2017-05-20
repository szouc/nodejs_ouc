# 1. 模块机制

## 1.1. Node 规范

![Node 规范]()

## 1.2. Node 的模块实现

![Node 模块机制]()

## 1.3. 包与 NPM

### 1.3.1. 包结构

符合 CommonJS 规范的包目录：

- **package.json**: 包描述文件
- **bin**: 存放可执行二进制文件
- **lib**: 存放 JavaScript 代码的目录
- **doc**: 存放文档
- **test**: 存放单元测试用例的代码

### 1.3.2. 包描述文件与 NPM

包描述文件字段：

- **name**: 包名
- **description**: 包简介
- **version**: 版本号
- **keywords**: 关键词数组
- **maintainers**: 包维护者
- **contributors**: 贡献者
- **bugs**: 提交 bug 地址
- **licenses**: 许可证
- **repositories**: 托管源代码位置
- **dependencies**: 当前包所需要依赖的包
- **homepage**: 包的网站
- **os**: 操作系统
- **cpu**: CPU 支持
- **engine**: JavaScript 引擎
- **builtin**: 是否是内建在底层系统的标准组件
- **directories**: 包目录说明
- **implements**: 实现规范
- **scripts**: 脚本

NPM 字段：

- **author**: 包作者
- **bin**: 命令行工具
- **main**: 模块引入入口
- **devDependencies**: 开发时需要依赖的包