# ChatVerse 部署脚本

## 步骤 1: 在 GitHub 上创建仓库

请手动在浏览器中访问以下链接创建仓库：

**https://github.com/new**

创建时填写：
- Repository name: `chatverse`
- Description: `ChatVerse - 虚拟聊天空间，支持多对象聊天和双轨制消息系统`
- Visibility: Public
- **不要**勾选 "Add a README file"
- **不要**勾选 "Add .gitignore"

创建完成后，返回此处继续。

## 步骤 2: 连接本地仓库到 GitHub

在终端中运行以下命令：

```bash
cd ChatVerse
git remote set-url origin git@github.com:zcsnpic/chatverse.git
git push -u origin master
```

## 步骤 3: 启用 GitHub Pages

1. 在浏览器中打开 https://github.com/zcsnpic/chatverse/settings/pages
2. Source 选择: **Deploy from a branch**
3. Branch 选择: **main** (或 master，取决于你推送的分支)，/ (root)
4. 点击 Save

## 步骤 4: 等待部署

等待约 1-2 分钟，访问你的网站：

**https://zcsnpic.github.io/chatverse/**

---

## 快速命令汇总

```bash
cd ChatVerse
git remote set-url origin git@github.com:zcsnpic/chatverse.git
git push -u origin master
```

然后访问 https://github.com/zcsnpic/chatverse/settings/pages 启用 GitHub Pages。
