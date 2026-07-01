#!/bin/bash
cd "$(dirname "$0")"
node scripts/sync_research_design_layout.mjs
read -p "程序执行完毕，按回车键退出..."