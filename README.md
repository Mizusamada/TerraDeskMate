<!-- BEGIN DOWNLOAD FRONT -->
# ⬇ 普通用户：下载即用

**[直接下载 全量版 0.3.1 EXE](https://github.com/Mizusamada/TerraDeskMate/releases/download/v0.3.1/TerraDeskMate-OneClick-Setup-0.3.1.exe)** · **[安装/便携使用说明](00-下载安装/README.md)** · **[按角色下载](00-下载安装/角色下载目录.md)**

单个联网安装 EXE 自动下载所有分卷并更新，无需手动打补丁。普通用户不需要 Node.js/npm；下方源码说明面向开发者。

<!-- END DOWNLOAD FRONT -->

## 0.3.1 角色与稳定性更新

最新资源：434角色、2853模型；新增克莱门莎、德·托莱多、旅骨，及酒神/真言/烈夏三套错位巡礼皮肤。新角色中日官方原声已补齐，日文原文标注仍缺，不能作为已审阅训练稿。Light通过六个完整角色包导入新增内容，其余版保留内置全角色。详见 `docs/RELEASE-0.3.1.md`。本次Release是0.3.0基础上的增量补丁，不是首次安装包；旧完整安装器和便携包保留。

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

### 从源码取得构建资源

Windows PowerShell：`powershell -ExecutionPolicy Bypass -File .\准备资源.ps1` 恢复基础资源。轻量可加 `-Role Beagle` 下载该角色文件夹；需独立权重时再加 `-IncludeVoiceWeights`。全量需离线合成环境时加 `-IncludeSpeechRuntime`，所有现有权重加 `-IncludeVoiceWeights`；这些大资源不会被普通源码克隆自动下载。没有该角色权重会明确提示。
