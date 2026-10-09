# TerraDeskMate · 全量版

泰拉桌伴 Windows x64 桌宠源码与资源目录。本体含全部已提供角色、皮肤、原声、高清替换资料和现有训练权重；本地语音运行环境仅共用一份。

## 开始

安装Node.js/npm后运行 npm ci、npm run build、npm start。此目录不是单个可执行文件；便携发行目录使用 npm run package:portable 生成。

## 使用说明

[完整分类使用说明书](docs/使用说明书/00-目录.md)

不含用户密钥、聊天存档、私人录音、测试资料或历史包。导入自动配置与安装程序已做专项验证，已有权重保留原验证状态。

## 普通用户双击安装

打开本目录的 **安装程序/2026-10-09-r1**，双击TerraDeskMat-Setup-0.3.0.exe。全量版必须把全部同名.bin与EXE放在同一目录；不用Node.js/npm。安装后用开始菜单或勾选桌面快捷方式打开。

开发者重新打安装器：npm ci后安装Inno Setup 6，设置INNO_ISCC为ISCC.exe路径，再npm run package:installer。每次生成新目录，不覆盖旧安装包。

也可以直接双击根目录的 **安装全量版.cmd** 打开安装器。根目录启动泰拉桌伴.cmd是开发源码入口，普通用户安装后用开始菜单启动。

## GitHub下载

[安装程序、角色资源与权重下载](https://github.com/Mizusamada/TerraDeskMate/releases)

源码克隆不含大资源。请按发布资源/下载目录.json取得完整资源，或执行准备资源.ps1恢复构建资源。安装程序下载后可双击安装，不要求npm。大文件使用Release附件，不要求购买Git LFS存储。
