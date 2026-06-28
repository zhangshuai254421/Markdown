## SECS-II协议
![alt text](image-5.png)
### 数据格式（Data Format）
SECS II 定义了Stream Function的结构及数据格式，一个Primary  Message 可传送的数据长度最多可达7.99MB。
Primary Message的数据(Data)  则由一些项目(Item)依序串接组成。
项目(Item)是一个信息数据包，其数据格式及长度定义在前2、3或4个字节中，这前几个字节称之为项目头IH（Item  Header）
### 项目头格式（Item Header Format） 
![alt text](image.png)
### 长度字节数（Number of Length Bytes） 
![alt text](image-1.png)
格式码（Format  Code）共有15种，可指定14种数据类型及一个分支码（List）。
分支码使Message具有树状结构，更容易用文字表达说明。
由此构成的结构语言即称为SML（SECS Message Language）。
分支码只有2~4个字节的Item  Header，说明在分支码包含几个项目Item。格式码分类如下。
### 格式码分类 
![alt text](image-4.png)
![alt text](image-3.png)


### SECS Message范例 
a.  一个项（Item）包含一个字节的二进制码数据 10101010.
>bits位
>87654321
>00100001      Item, binary, 1 length byte
>00000001      1 byte long
>10101010      data byte

b.  一个项（Item）包含三个字节的ASCII码数据ABC
>01000001      Item, ASCII, 1 length byte
>00000011      Three bytes long
>01000001      ASCII A
>01000010       ASCII B
>01000011      ASCII C

c.  一个项（Item）包含三个双字节有符号整型数据（2-byte integer）
>01101001     Item, 2-byte integers
>00000110     6 bytes total (6/2=3 integers)
>xxxxxxxx      MSB number x
>xxxxxxxx      LSB number x
>yyyyyyyy     MSB number y
>yyyyyyyy     LSB number y
>zzzzzzzz      MSB number z
>zzzzzzzz      LSB number z

d.  一个项（Item）包含一个四字节浮点型数据（4-byte  float）
>10010001     Item, 4-byte floating point
>00000100     4 bytes (4/4=1 number)
>FFFFFFFF
>FFFFFFFF     Floating point  number
>FFFFFFFF     in IEEE 754
>FFFFFFFF

### 数据结构 (Message Data Structure)
![alt text](image-6.png)
其中消息头(Message Header)的10个字节展开如下:
#### 消息头（Message Header 10 Bytes） 
![alt text](image-7.png)

![alt text](image-29.png)

![alt text](image-30.png)

![alt text](image-8.png)
![alt text](image-9.png)
![alt text](image-10.png)
![alt text](image-11.png)
![alt text](image-12.png)
![alt text](image-13.png)
![alt text](image-14.png)
![alt text](image-15.png)
![alt text](image-16.png)
![alt text](image-17.png)
![alt text](image-18.png)
![alt text](image-19.png)
![alt text](image-20.png)
![alt text](image-22.png)
![alt text](image-23.png)
![alt text](image-24.png)
![alt text](image-25.png)
![alt text](image-26.png)
![alt text](image-27.png)
![alt text](image-28.png)


参考
https://www.cnblogs.com/huageyiyangdewo/p/17421112.html