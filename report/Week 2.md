# Week 2

仅记录和学习计算机相关的内容，上课/写作业/摸鱼/休息不计入其中

## 9.13

* 8:00~14:30：搭建arch-linux，遇到的障碍：

  * 关闭windows安全模式（试了三四种方法，最后发现在BIOS里修改）
  * 设置启动顺序（在BIOS里修改几种方式的顺序）
  * 连接网络后，打开wlan0（初始状态为off，使用`iwconfig wlan0 txpower on`）
  * 连接校园网后ping不通（尝试手机热点，结果热点不稳定）
  * 部署grub报错

  清空磁盘重装好几次，卡在了最后一个问题上，推测原因是mount挂错

  配置网络时校园网连不了，手机热点不稳定（有时候会自动关闭，导致进行到后面网络断连）

  打算晚上在811继续装

* 15:00~17:30：学习pkill、lsof和awk指令，背日语/英语单词

* 18:30~22:00：重新开始装archlinux，成功，但还有一些小细节没有调整，比如图形界面下的中文乱码问题

## 9.14

* 10:10~11:50：在复变课上看CSAPP，第二章看到移位运算

* 19:00~20:00：解决linux的中文字体问题，下载firefox
* 20:00~20:30：记录安装arch的踩坑
* 20:40~23:30：学docker，安装出现问题

## 9.15

* 8:00~9:40：在马原课上看CSAPP，第二章看到补码
* 10:10~11:40：学习awk指令
* 12:25~14:25：同上，学完awk
* 14:30\~17:00，17:40\~21:00：配置archlinux，在帮助下下载了typora、输入法、qq...中间内核炸了一次，qq还有一些bug
* 23:20~23:50：看CSAPP

## 9.16

* 8:00~11:30：改课设bug
* 12:20~17:30：配置archlinux，下载vscode，修改默认shell，设置clash自启动
* 18:20~21:30：复习一部分linux笔记，在帮助下解决了qq的bug，此外学到了一些黑科技和使用kde的小技巧，总结成笔记
* 22:00~23:30：划水穿插着看CSAPP

打算明天看一下文件系统的知识，继续复习linux

## 9.17

* 8:00~11:15：复习linux，简略看了下linux中文件系统

下午到傍晚做了一些抄报告和作业等无聊的事情...

* 20:30~22:10：看CSAPP，看到浮点数

## 9.18

* 8:40~9:30：arch又炸了，hexo报错解决了，复习linux

然后学日语、学大物和复变...

* 在帮助下修好了arch的bug

* 14:30~16:05：在cpp课上 看CSAPP，第二章看完
* 18:50~19:30：学习了IO重定向
* 19:30~20:00：了解了一点cmake，暂时不想继续学
* 20:10~21:30：试图开始做data lab，中间发现了《读厚/薄CSAPP》系列博客，于是开始看...
* 21:30~22:20：半摸鱼半看博客...

## 9.19

* 8:30~11:00：做data lab
* 13:20~14:10：同上
* 18:10~18:50：data lab把中午没看完的一道题看完，整理MU材料
* 19:00~19:40：MU
* 20:40~21:15：data lab

## 周总结

大概做了这些事：

* 安装archlinux，了解了部分相关指令，一边查资料一边安装软件，配置环境（踩了一些坑）
* 复习linux指令，了解了I/O重定向，学习awk指令
* 看完CSAPP第二章，开始做datalab



Future计划：

* 以完成新人任务为主
* 以后学makefile、cmake、docker
* 坚持读CSAPP，还有计网自顶向下
