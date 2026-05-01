FTQ.cc


  git clone https://github.com/a452174234/SpecScaffold.git                                                                cd SpecScaffold
  npm install && cd backend && npm install && cd ../frontend && npm install && cd ..                                      npm run db:init                                                    nage
  npm run dev


必装

  ┌─────────┬──────────┬──────────┬─────────────────────┐
  │  工具   │ 最低版本 │ 推荐版本 │        用途         │
  ├─────────┼──────────┼──────────┼─────────────────────┤
  │ Node.js │ >= 18    │ v22.x    │ 运行前后端          │
  ├─────────┼──────────┼──────────┼─────────────────────┤
  │ Git     │ >= 2.30  │ 最新     │ 版本控制 + 自动提交 │
  └─────────┴──────────┴──────────┴─────────────────────┘

  ▎ Node.js 自带 npm，不需要单独装。

  编译依赖（better-sqlite3 原生模块需要）

  ┌──────────────┬────────┬───────────────────┐
  │     工具     │  版本  │       用途        │
  ├──────────────┼────────┼───────────────────┤
  │ Python       │ >= 3.8 │ node-gyp 编译依赖 │
  ├──────────────┼────────┼───────────────────┤
  │ C++ 编译工具 │ —      │ 见下方系统说明    │
  └──────────────┴────────┴───────────────────┘

  Windows（你当前环境）

  - Visual Studio Build Tools — 安装时勾选「C++ 桌面开发」工作负载
  - 下载地址：https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - 或者已装了完整 Visual Studio 的话已经有了

  macOS

  xcode-select --install

  Linux (Ubuntu/Debian)

  sudo apt install build-essential python3

  可选（AI 功能需要）

  ┌─────────────────┬─────────────────────────────────────────────────┐
  │      工具       │                      说明                       │
  ├─────────────────┼─────────────────────────────────────────────────┤
  │ Claude Code CLI │ AI 代码生成功能依赖，需安装并 claude login 认证 │
  └─────────────────┴─────────────────────────────────────────────────┘

  ---
  换电脑后一键安装

  git clone https://github.com/a452174234/SpecScaffold.git
  cd SpecScaffold
  npm install
  cd backend && npm install && cd ..
  cd frontend && npm install && cd ..
  npm run db:init
  npm run dev

  总结： 只需要装 Node.js v22 + Git + Visual Studio Build Tools（含C++）。Python 是 Build Tools 的附带依赖，不用单独装。
