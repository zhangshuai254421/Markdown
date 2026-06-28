# WPF ControlTemplate 使用指南

## 目录

1. [什么是 ControlTemplate](#1-什么是-controltemplate)
2. [ControlTemplate vs DataTemplate](#2-controltemplate-vs-datatemplate)
3. [基本结构与语法](#3-基本结构与语法)
4. [TemplateBinding —— 模板绑定](#4-templatebinding--模板绑定)
5. [TemplatePart 特性](#5-templatepart-特性)
6. [触发器 (Triggers)](#6-触发器-triggers)
7. [VisualStateManager](#7-visualstatemanager)
8. [完整示例 —— 自定义 Button](#8-完整示例--自定义-button)
9. [完整示例 —— 自定义 TextBox](#9-完整示例--自定义-textbox)
10. [完整示例 —— 自定义 ComboBox](#10-完整示例--自定义-combobox)
11. [最佳实践与常见陷阱](#11-最佳实践与常见陷阱)

---

## 1. 什么是 ControlTemplate

`ControlTemplate` 定义了**控件的视觉结构**——它决定了控件"长什么样"，而不改变控件的逻辑行为。通过替换控件的 `Template` 属性，你可以完全重写一个控件的外观，同时保留其内置的行为逻辑（如 Button 的点击、TextBox 的输入等）。

> **核心原则**：WPF 中的"无外观"(lookless) 设计意味着控件的逻辑和外观是分离的。`ControlTemplate` 正是这种分离的关键。

---

## 2. ControlTemplate vs DataTemplate

| 特性 | ControlTemplate | DataTemplate |
|------|:--------------:|:------------:|
| 用途 | 定义**控件**的外观 | 定义**数据**的呈现方式 |
| 绑定上下文 | 控件自身 (`TemplateBinding`) | 数据对象 (`Binding`) |
| 应用方式 | `Control.Template` 属性 | `ItemsControl.ItemTemplate`、`ContentControl.ContentTemplate` 等 |
| TargetType | 必须指定控件类型 | 必须指定数据类型 |

```xml
<!-- ControlTemplate：控制 Button 自身的外观 -->
<ControlTemplate TargetType="Button">
    <Border Background="{TemplateBinding Background}">
        <ContentPresenter/>
    </Border>
</ControlTemplate>

<!-- DataTemplate：控制 ListBox 中每一项数据的呈现 -->
<DataTemplate DataType="{x:Type local:Person}">
    <StackPanel>
        <TextBlock Text="{Binding Name}"/>
        <TextBlock Text="{Binding Age}"/>
    </StackPanel>
</DataTemplate>
```

---

## 3. 基本结构与语法

### 3.1 TargetType

`TargetType` 指定此模板适用的控件类型，它有两个作用：
- 使 `TemplateBinding` 能够自动解析目标属性的类型
- 允许在 XAML 中省略绑定路径时使用默认路径

```xml
<ControlTemplate TargetType="{x:Type Button}">
    <!-- 模板内容 -->
</ControlTemplate>
```

### 3.2 关键属性

```xml
<ControlTemplate x:Key="MyButtonTemplate"
                 TargetType="{x:Type Button}">
    <!-- 
      x:Key：在 ResourceDictionary 中引用时的键名
      TargetType：模板适用的控件类型（必须）
    -->
</ControlTemplate>
```

### 3.3 模板中的命名元素

```xml
<ControlTemplate TargetType="Button" x:Key="RoundedButtonTemplate">
    <Border x:Name="border"
            Background="{TemplateBinding Background}"
            BorderBrush="{TemplateBinding BorderBrush}"
            BorderThickness="{TemplateBinding BorderThickness}"
            CornerRadius="8"
            SnapsToDevicePixels="True">
        <ContentPresenter x:Name="contentPresenter"
                          Margin="{TemplateBinding Padding}"
                          HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                          VerticalAlignment="{TemplateBinding VerticalContentAlignment}"
                          RecognizesAccessKey="True"
                          SnapsToDevicePixels="{TemplateBinding SnapsToDevicePixels}"/>
    </Border>
</ControlTemplate>
```

**结构要点**：
1. 模板的根元素通常是一个 `Border` 或其他 `Panel`
2. `ContentPresenter` 负责显示控件的 `Content` 属性
3. `x:Name` 用于在触发器或代码隐藏中引用元素
4. `SnapsToDevicePixels="True"` 确保像素对齐，避免模糊

---

## 4. TemplateBinding —— 模板绑定

`TemplateBinding` 是 `ControlTemplate` 内部的轻量级绑定，它将模板内元素的属性**单向**绑定到目标控件的属性。

### 4.1 基本用法

```xml
<!-- TemplateBinding：简写形式 -->
<Border Background="{TemplateBinding Background}"/>

<!-- 等价于完整的 Binding -->
<Border Background="{Binding Background, RelativeSource={RelativeSource TemplatedParent}}"/>
```

### 4.2 TemplateBinding 的限制

| 限制 | 说明 |
|------|------|
| 仅单向 | 无法将模板内的值传回控件 |
| 无 Converter | 不支持 `IValueConverter` |
| 无 StringFormat | 不支持格式化 |
| 无 Mode | 始终为 `OneWay` |

**当需要双向绑定或使用 Converter 时，必须使用完整 Binding**：

```xml
<!-- ❌ TemplateBinding 不支持 -->
<TextBox Text="{TemplateBinding Text}"/>

<!-- ✅ 使用完整 Binding，支持双向绑定 -->
<TextBox Text="{Binding Text, 
                  RelativeSource={RelativeSource TemplatedParent}, 
                  Mode=TwoWay, 
                  UpdateSourceTrigger=PropertyChanged}"/>
```

### 4.3 常用 TemplateBinding 属性映射

```xml
<ControlTemplate TargetType="Button">
    <Border Background="{TemplateBinding Background}"
            BorderBrush="{TemplateBinding BorderBrush}"
            BorderThickness="{TemplateBinding BorderThickness}"
            Padding="{TemplateBinding Padding}"
            SnapsToDevicePixels="True">
        <ContentPresenter Content="{TemplateBinding Content}"
                          ContentTemplate="{TemplateBinding ContentTemplate}"
                          Margin="{TemplateBinding Padding}"
                          HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                          VerticalAlignment="{TemplateBinding VerticalContentAlignment}"
                          RecognizesAccessKey="True"/>
    </Border>
</ControlTemplate>
```

---

## 5. TemplatePart 特性

`[TemplatePart]` 特性用于声明一个控件期望其 `ControlTemplate` 中包含哪些命名元素。它告诉使用者："如果你自定义模板，请包含这些命名的部件，否则控件可能无法正常工作"。

### 5.1 定义 TemplatePart（控件作者视角）

```csharp
[TemplatePart(Name = "PART_Header", Type = typeof(ContentPresenter))]
[TemplatePart(Name = "PART_CloseButton", Type = typeof(Button))]
public class CustomDialog : ContentControl
{
    private ContentPresenter _headerPresenter;
    private Button _closeButton;

    public override void OnApplyTemplate()
    {
        base.OnApplyTemplate();

        // 在模板应用时查找命名部件
        _headerPresenter = GetTemplateChild("PART_Header") as ContentPresenter;
        _closeButton = GetTemplateChild("PART_CloseButton") as Button;

        if (_closeButton != null)
            _closeButton.Click += OnCloseButtonClick;
    }

    private void OnCloseButtonClick(object sender, RoutedEventArgs e)
    {
        // 处理关闭逻辑
    }
}
```

### 5.2 在模板中使用 PART_ 前缀元素（模板使用者视角）

```xml
<ControlTemplate TargetType="local:CustomDialog">
    <Border Background="{TemplateBinding Background}"
            BorderBrush="{TemplateBinding BorderBrush}"
            CornerRadius="6">
        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
            </Grid.RowDefinitions>

            <!-- PART_Header：控件通过 GetTemplateChild 查找此元素 -->
            <ContentPresenter x:Name="PART_Header"
                              Grid.Row="0"
                              Margin="12,8"/>

            <!-- PART_CloseButton：控件在此订阅 Click 事件 -->
            <Button x:Name="PART_CloseButton"
                    Grid.Row="0"
                    HorizontalAlignment="Right"
                    Content="✕"
                    Style="{StaticResource CloseButtonStyle}"/>

            <ContentPresenter Grid.Row="1" Margin="12,0,12,12"/>
        </Grid>
    </Border>
</ControlTemplate>
```

> **命名约定**：`PART_` 前缀是 WPF 中的约定，用于标识控件代码会通过 `GetTemplateChild` 查找的模板元素。

### 5.3 常见控件的 TemplatePart

| 控件 | 必需的 PART_ 元素 |
|------|------------------|
| `ComboBox` | `PART_EditableTextBox`、`PART_Popup` |
| `TextBox` | `PART_ContentHost` |
| `Slider` | `PART_Track` |
| `ScrollBar` | `PART_Track` |
| `TabControl` | `PART_SelectedContentHost` |
| `PasswordBox` | `PART_ContentHost` |
| `ListBox` | `PART_ScrollViewer`（通过 `ItemsControl`） |
| `DataGrid` | 多个 PART_ 元素 |

---

## 6. 触发器 (Triggers)

### 6.1 Trigger —— 属性触发器

根据控件属性值的变化来改变模板内元素的属性：

```xml
<ControlTemplate.Triggers>
    <!-- IsMouseOver 触发器 -->
    <Trigger Property="IsMouseOver" Value="True">
        <Setter TargetName="border" Property="Background" Value="#3A3A3A"/>
        <Setter TargetName="border" Property="BorderBrush" Value="#6A6A6A"/>
    </Trigger>

    <!-- IsPressed 触发器 -->
    <Trigger Property="IsPressed" Value="True">
        <Setter TargetName="border" Property="Background" Value="#2A2A2A"/>
        <Setter TargetName="border" Property="BorderBrush" Value="#0078D4"/>
    </Trigger>

    <!-- IsEnabled 触发器 -->
    <Trigger Property="IsEnabled" Value="False">
        <Setter TargetName="border" Property="Opacity" Value="0.5"/>
    </Trigger>
</ControlTemplate.Triggers>
```

### 6.2 MultiTrigger —— 多条件触发器

当多个条件同时满足时触发：

```xml
<MultiTrigger>
    <MultiTrigger.Conditions>
        <Condition Property="IsMouseOver" Value="True"/>
        <Condition Property="IsFocused" Value="True"/>
    </MultiTrigger.Conditions>
    <Setter TargetName="border" Property="BorderBrush" Value="#FF0078D4"/>
    <Setter TargetName="border" Property="BorderThickness" Value="2"/>
</MultiTrigger>
```

### 6.3 DataTrigger —— 数据触发器

基于绑定的数据值触发：

```xml
<!-- 当绑定的数据发生变化时触发 -->
<DataTrigger Binding="{Binding Path=IsSelected, RelativeSource={RelativeSource TemplatedParent}}"
             Value="True">
    <Setter TargetName="border" Property="Background" Value="#0078D4"/>
</DataTrigger>

<MultiDataTrigger>
    <MultiDataTrigger.Conditions>
        <Condition Binding="{Binding IsMouseOver, RelativeSource={RelativeSource Self}}" Value="True"/>
        <Condition Binding="{Binding IsSelected, RelativeSource={RelativeSource TemplatedParent}}" Value="False"/>
    </MultiDataTrigger.Conditions>
    <Setter TargetName="border" Property="Background" Value="#3A3A3A"/>
</MultiDataTrigger>
```

### 6.4 EventTrigger —— 事件触发器

用于触发动画（不能设置属性）：

```xml
<EventTrigger RoutedEvent="MouseEnter">
    <BeginStoryboard>
        <Storyboard>
            <DoubleAnimation Storyboard.TargetName="border"
                             Storyboard.TargetProperty="Opacity"
                             To="0.8"
                             Duration="0:0:0.2"/>
        </Storyboard>
    </BeginStoryboard>
</EventTrigger>
```

### 6.5 Trigger 执行顺序与优先级

```
1. 属性默认值（最低优先级）
2. Style Setter（非 Trigger）
3. ControlTemplate 中的直接属性值
4. Template Trigger
5. Template MultiTrigger
6. 本地值 / 动画（最高优先级）
```

---

## 7. VisualStateManager

`VisualStateManager`（VSM）是管理控件视觉状态的现代方式，自 WPF 4.0 起引入（最初来自 Silverlight）。与传统的 Trigger 相比，VSM 更适合复杂的视觉状态切换。

### 7.1 基本结构

```xml
<ControlTemplate TargetType="Button">
    <Border x:Name="border"
            Background="{TemplateBinding Background}"
            CornerRadius="4">
        <VisualStateManager.VisualStateGroups>
            <VisualStateGroup x:Name="CommonStates">
                <!-- 正常状态 -->
                <VisualState x:Name="Normal"/>
                
                <!-- 鼠标悬停 -->
                <VisualState x:Name="MouseOver">
                    <Storyboard>
                        <ColorAnimation Storyboard.TargetName="border"
                                        Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                        To="#4A4A4A"
                                        Duration="0:0:0.15"/>
                    </Storyboard>
                </VisualState>

                <!-- 按下状态 -->
                <VisualState x:Name="Pressed">
                    <Storyboard>
                        <ColorAnimation Storyboard.TargetName="border"
                                        Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                        To="#2A2A2A"
                                        Duration="0:0:0.05"/>
                    </Storyboard>
                </VisualState>

                <!-- 禁用状态 -->
                <VisualState x:Name="Disabled">
                    <Storyboard>
                        <DoubleAnimation Storyboard.TargetName="border"
                                         Storyboard.TargetProperty="Opacity"
                                         To="0.5"
                                         Duration="0"/>
                    </Storyboard>
                </VisualState>
            </VisualStateGroup>

            <!-- 焦点状态组 -->
            <VisualStateGroup x:Name="FocusStates">
                <VisualState x:Name="Focused">
                    <Storyboard>
                        <DoubleAnimation Storyboard.TargetName="focusVisual"
                                         Storyboard.TargetProperty="Opacity"
                                         To="1"
                                         Duration="0"/>
                    </Storyboard>
                </VisualState>
                <VisualState x:Name="Unfocused"/>
            </VisualStateGroup>
        </VisualStateManager.VisualStateGroups>

        <ContentPresenter x:Name="contentPresenter"
                          Margin="{TemplateBinding Padding}"
                          HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                          VerticalAlignment="{TemplateBinding VerticalContentAlignment}"/>

        <!-- 焦点视觉元素 -->
        <Border x:Name="focusVisual"
                BorderBrush="#0078D4"
                BorderThickness="2"
                CornerRadius="4"
                Opacity="0"
                IsHitTestVisible="False"/>
    </Border>
</ControlTemplate>
```

### 7.2 VisualStateGroup 说明

| VisualStateGroup | 说明 | 常见状态 |
|------------------|------|---------|
| `CommonStates` | 基本交互状态 | `Normal`、`MouseOver`、`Pressed`、`Disabled` |
| `FocusStates` | 焦点相关状态 | `Focused`、`Unfocused` |
| `ValidationStates` | 验证状态 | `Valid`、`InvalidFocused`、`InvalidUnfocused` |
| `SelectionStates` | 选择状态（如 ListBoxItem） | `Selected`、`Unselected`、`SelectedUnfocused` |
| `CheckStates` | 勾选状态（如 CheckBox） | `Checked`、`Unchecked`、`Indeterminate` |
| `ExpandStates` | 展开状态（如 Expander） | `Expanded`、`Collapsed` |

### 7.3 使用 VisualStateManager.GoToState

在控件的代码隐藏中，使用 `GoToState` 切换状态：

```csharp
// 在控件的代码中切换状态
VisualStateManager.GoToState(this, "MouseOver", useTransitions: true);
```

```csharp
// 在 CustomControl 中响应属性变化
protected override void OnMouseEnter(MouseEventArgs e)
{
    base.OnMouseEnter(e);
    VisualStateManager.GoToState(this, "MouseOver", true);
}
```

### 7.4 自定义 VisualStateGroup

```xml
<VisualStateManager.VisualStateGroups>
    <!-- 自定义状态组 -->
    <VisualStateGroup x:Name="WatermarkStates">
        <VisualState x:Name="WatermarkVisible">
            <Storyboard>
                <DoubleAnimation Storyboard.TargetName="watermark"
                                 Storyboard.TargetProperty="Opacity"
                                 To="0.6"
                                 Duration="0:0:0.1"/>
            </Storyboard>
        </VisualState>
        <VisualState x:Name="WatermarkHidden">
            <Storyboard>
                <DoubleAnimation Storyboard.TargetName="watermark"
                                 Storyboard.TargetProperty="Opacity"
                                 To="0"
                                 Duration="0:0:0.1"/>
            </Storyboard>
        </VisualState>
    </VisualStateGroup>
</VisualStateManager.VisualStateGroups>
```

---

## 8. 完整示例 —— 自定义 Button

### 8.1 效果预览

一个圆角按钮，带有：
- 悬停时的背景色渐变动画
- 按下时的缩放效果
- 聚焦时的虚线边框
- 禁用时的半透明效果

### 8.2 XAML 模板

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- 圆角按钮样式 -->
    <Style x:Key="RoundedButtonStyle" TargetType="{x:Type Button}">
        <Setter Property="Background" Value="#0078D4"/>
        <Setter Property="Foreground" Value="White"/>
        <Setter Property="BorderBrush" Value="#005A9E"/>
        <Setter Property="BorderThickness" Value="1"/>
        <Setter Property="Padding" Value="16,8"/>
        <Setter Property="HorizontalContentAlignment" Value="Center"/>
        <Setter Property="VerticalContentAlignment" Value="Center"/>
        <Setter Property="FontSize" Value="14"/>
        <Setter Property="FontWeight" Value="SemiBold"/>
        <Setter Property="Cursor" Value="Hand"/>
        <Setter Property="UseLayoutRounding" Value="True"/>
        <Setter Property="Template">
            <Setter.Value>
                <ControlTemplate TargetType="{x:Type Button}">
                    <Border x:Name="border"
                            Background="{TemplateBinding Background}"
                            BorderBrush="{TemplateBinding BorderBrush}"
                            BorderThickness="{TemplateBinding BorderThickness}"
                            CornerRadius="6"
                            RenderTransformOrigin="0.5,0.5"
                            SnapsToDevicePixels="True">
                        
                        <Border.RenderTransform>
                            <ScaleTransform x:Name="scaleTransform" ScaleX="1" ScaleY="1"/>
                        </Border.RenderTransform>

                        <VisualStateManager.VisualStateGroups>
                            <VisualStateGroup x:Name="CommonStates">
                                <VisualState x:Name="Normal"/>
                                <VisualState x:Name="MouseOver">
                                    <Storyboard>
                                        <ColorAnimation Storyboard.TargetName="border"
                                                        Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                                        To="#1A8CE8"
                                                        Duration="0:0:0.15"/>
                                        <ColorAnimation Storyboard.TargetName="border"
                                                        Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)"
                                                        To="#0078D4"
                                                        Duration="0:0:0.15"/>
                                        <DoubleAnimation Storyboard.TargetName="dropShadow"
                                                         Storyboard.TargetProperty="Opacity"
                                                         To="0.3"
                                                         Duration="0:0:0.15"/>
                                    </Storyboard>
                                </VisualState>
                                <VisualState x:Name="Pressed">
                                    <Storyboard>
                                        <ColorAnimation Storyboard.TargetName="border"
                                                        Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                                        To="#005A9E"
                                                        Duration="0:0:0.05"/>
                                        <DoubleAnimation Storyboard.TargetName="scaleTransform"
                                                         Storyboard.TargetProperty="ScaleX"
                                                         To="0.97"
                                                         Duration="0:0:0.05"/>
                                        <DoubleAnimation Storyboard.TargetName="scaleTransform"
                                                         Storyboard.TargetProperty="ScaleY"
                                                         To="0.97"
                                                         Duration="0:0:0.05"/>
                                        <DoubleAnimation Storyboard.TargetName="dropShadow"
                                                         Storyboard.TargetProperty="Opacity"
                                                         To="0"
                                                         Duration="0:0:0.05"/>
                                    </Storyboard>
                                </VisualState>
                                <VisualState x:Name="Disabled">
                                    <Storyboard>
                                        <DoubleAnimation Storyboard.TargetName="border"
                                                         Storyboard.TargetProperty="Opacity"
                                                         To="0.4"
                                                         Duration="0"/>
                                    </Storyboard>
                                </VisualState>
                            </VisualStateGroup>
                            <VisualStateGroup x:Name="FocusStates">
                                <VisualState x:Name="Focused">
                                    <Storyboard>
                                        <ObjectAnimationUsingKeyFrames Storyboard.TargetName="focusBorder"
                                                                       Storyboard.TargetProperty="Visibility">
                                            <DiscreteObjectKeyFrame Value="{x:Static Visibility.Visible}"/>
                                        </ObjectAnimationUsingKeyFrames>
                                    </Storyboard>
                                </VisualState>
                                <VisualState x:Name="Unfocused"/>
                            </VisualStateGroup>
                        </VisualStateManager.VisualStateGroups>

                        <Grid>
                            <!-- 投影效果 -->
                            <Border x:Name="dropShadow"
                                    Background="#000000"
                                    CornerRadius="6"
                                    Opacity="0"
                                    IsHitTestVisible="False">
                                <Border.RenderTransform>
                                    <TranslateTransform Y="2"/>
                                </Border.RenderTransform>
                            </Border>

                            <!-- 主边框 -->
                            <Border x:Name="mainBorder"
                                    Background="Transparent"
                                    BorderBrush="Transparent"
                                    CornerRadius="6">
                                
                                <!-- 内容 -->
                                <ContentPresenter x:Name="contentPresenter"
                                                  Margin="{TemplateBinding Padding}"
                                                  HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                                                  VerticalAlignment="{TemplateBinding VerticalContentAlignment}"
                                                  RecognizesAccessKey="True"
                                                  TextBlock.Foreground="{TemplateBinding Foreground}"
                                                  TextBlock.FontSize="{TemplateBinding FontSize}"
                                                  TextBlock.FontWeight="{TemplateBinding FontWeight}"/>
                            </Border>

                            <!-- 聚焦指示器 -->
                            <Border x:Name="focusBorder"
                                    BorderBrush="{TemplateBinding Foreground}"
                                    BorderThickness="1"
                                    CornerRadius="6"
                                    Visibility="Collapsed"
                                    IsHitTestVisible="False">
                                <Border.RenderTransform>
                                    <ScaleTransform ScaleX="1.03" ScaleY="1.08"/>
                                </Border.RenderTransform>
                            </Border>
                        </Grid>
                    </Border>

                    <ControlTemplate.Triggers>
                        <!-- 使用 Trigger 作为 VSM 的补充（处理键盘焦点等场景） -->
                        <Trigger Property="IsKeyboardFocused" Value="True">
                            <Setter TargetName="focusBorder" Property="Visibility" Value="Visible"/>
                        </Trigger>
                    </ControlTemplate.Triggers>
                </ControlTemplate>
            </Setter.Value>
        </Setter>
    </Style>
</ResourceDictionary>
```

### 8.3 使用方式

```xml
<!-- 引用资源字典 -->
<Window.Resources>
    <ResourceDictionary Source="ButtonStyles.xaml"/>
</Window.Resources>

<!-- 使用自定义按钮 -->
<StackPanel HorizontalAlignment="Center" VerticalAlignment="Center">
    <Button Style="{StaticResource RoundedButtonStyle}"
            Content="提交"
            Width="120"
            Margin="0,0,0,12"
            Click="OnSubmitClick"/>

    <Button Style="{StaticResource RoundedButtonStyle}"
            Content="取消"
            Width="120"
            Background="#E81123"
            BorderBrush="#B70E1C"/>
</StackPanel>
```

---

## 9. 完整示例 —— 自定义 TextBox

### 9.1 XAML 模板（带水印、圆角、错误状态）

```xml
<Style x:Key="ModernTextBoxStyle" TargetType="{x:Type TextBox}">
    <Setter Property="Background" Value="#FFFFFF"/>
    <Setter Property="Foreground" Value="#1A1A1A"/>
    <Setter Property="BorderBrush" Value="#D0D0D0"/>
    <Setter Property="BorderThickness" Value="1"/>
    <Setter Property="Padding" Value="12,8"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="VerticalContentAlignment" Value="Center"/>
    <Setter Property="CaretBrush" Value="#0078D4"/>
    <Setter Property="SelectionBrush" Value="#99C4EE"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="{x:Type TextBox}">
                <Border x:Name="border"
                        Background="{TemplateBinding Background}"
                        BorderBrush="{TemplateBinding BorderBrush}"
                        BorderThickness="{TemplateBinding BorderThickness}"
                        CornerRadius="4"
                        SnapsToDevicePixels="True">
                    
                    <VisualStateManager.VisualStateGroups>
                        <VisualStateGroup x:Name="CommonStates">
                            <VisualState x:Name="Normal"/>
                            <VisualState x:Name="MouseOver">
                                <Storyboard>
                                    <ColorAnimation Storyboard.TargetName="border"
                                                    Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)"
                                                    To="#A0A0A0"
                                                    Duration="0:0:0.1"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="Disabled">
                                <Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="border"
                                                     Storyboard.TargetProperty="Opacity"
                                                     To="0.5"
                                                     Duration="0"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="ReadOnly">
                                <Storyboard>
                                    <ColorAnimation Storyboard.TargetName="border"
                                                    Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                                    To="#F5F5F5"
                                                    Duration="0"/>
                                </Storyboard>
                            </VisualState>
                        </VisualStateGroup>
                        <VisualStateGroup x:Name="FocusStates">
                            <VisualState x:Name="Focused">
                                <Storyboard>
                                    <ColorAnimation Storyboard.TargetName="border"
                                                    Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)"
                                                    To="#0078D4"
                                                    Duration="0:0:0.1"/>
                                    <DoubleAnimation Storyboard.TargetName="border"
                                                     Storyboard.TargetProperty="(Border.BorderThickness).(Thickness.Left)"
                                                     To="2"
                                                     Duration="0:0:0.1"/>
                                    <DoubleAnimation Storyboard.TargetName="border"
                                                     Storyboard.TargetProperty="(Border.BorderThickness).(Thickness.Right)"
                                                     To="2"
                                                     Duration="0:0:0.1"/>
                                    <DoubleAnimation Storyboard.TargetName="border"
                                                     Storyboard.TargetProperty="(Border.BorderThickness).(Thickness.Top)"
                                                     To="2"
                                                     Duration="0:0:0.1"/>
                                    <DoubleAnimation Storyboard.TargetName="border"
                                                     Storyboard.TargetProperty="(Border.BorderThickness).(Thickness.Bottom)"
                                                     To="2"
                                                     Duration="0:0:0.1"/>
                                    <DoubleAnimation Storyboard.TargetName="watermark"
                                                     Storyboard.TargetProperty="Opacity"
                                                     To="0.35"
                                                     Duration="0:0:0.1"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="Unfocused">
                                <Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="watermark"
                                                     Storyboard.TargetProperty="Opacity"
                                                     To="0.5"
                                                     Duration="0:0:0.1"/>
                                </Storyboard>
                            </VisualState>
                        </VisualStateGroup>
                    </VisualStateManager.VisualStateGroups>

                    <Grid>
                        <!-- 水印文本 -->
                        <TextBlock x:Name="watermark"
                                   Text="{Binding Tag, RelativeSource={RelativeSource TemplatedParent}}"
                                   Foreground="{TemplateBinding Foreground}"
                                   Opacity="0.5"
                                   VerticalAlignment="Center"
                                   Margin="{TemplateBinding Padding}"
                                   IsHitTestVisible="False"
                                   Visibility="Collapsed"/>

                        <!-- 核心内容宿主（必须命名为 PART_ContentHost） -->
                        <ScrollViewer x:Name="PART_ContentHost"
                                      Margin="{TemplateBinding Padding}"
                                      Focusable="False"
                                      HorizontalScrollBarVisibility="Hidden"
                                      VerticalScrollBarVisibility="Hidden"/>
                    </Grid>
                </Border>

                <ControlTemplate.Triggers>
                    <!-- 当文本为空且未聚焦时，显示水印 -->
                    <MultiTrigger>
                        <MultiTrigger.Conditions>
                            <Condition Property="Text" Value=""/>
                            <Condition Property="IsFocused" Value="False"/>
                        </MultiTrigger.Conditions>
                        <Setter TargetName="watermark" Property="Visibility" Value="Visible"/>
                    </MultiTrigger>

                    <!-- 当文本为空但聚焦时，也显示水印但更淡 -->
                    <MultiTrigger>
                        <MultiTrigger.Conditions>
                            <Condition Property="Text" Value=""/>
                            <Condition Property="IsFocused" Value="True"/>
                        </MultiTrigger.Conditions>
                        <Setter TargetName="watermark" Property="Visibility" Value="Visible"/>
                        <Setter TargetName="watermark" Property="Opacity" Value="0.3"/>
                    </MultiTrigger>
                </ControlTemplate.Triggers>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

> **重要**：TextBox 的模板**必须**包含名为 `PART_ContentHost` 的 `ScrollViewer` 或 `Decorator`，否则文本编辑功能将不可用。

### 9.2 使用方式

```xml
<TextBox Style="{StaticResource ModernTextBoxStyle}"
         Tag="请输入用户名"
         Width="280"
         Margin="0,8"/>
```

---

## 10. 完整示例 —— 自定义 ComboBox

### 10.1 XAML 模板

```xml
<Style x:Key="ModernComboBoxStyle" TargetType="{x:Type ComboBox}">
    <Setter Property="Background" Value="#FFFFFF"/>
    <Setter Property="Foreground" Value="#1A1A1A"/>
    <Setter Property="BorderBrush" Value="#D0D0D0"/>
    <Setter Property="BorderThickness" Value="1"/>
    <Setter Property="Padding" Value="12,8"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="VerticalContentAlignment" Value="Center"/>
    <Setter Property="ScrollViewer.HorizontalScrollBarVisibility" Value="Auto"/>
    <Setter Property="ScrollViewer.VerticalScrollBarVisibility" Value="Auto"/>
    <Setter Property="ScrollViewer.CanContentScroll" Value="True"/>
    <Setter Property="SnapsToDevicePixels" Value="True"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="{x:Type ComboBox}">
                <Grid x:Name="templateRoot" SnapsToDevicePixels="True">
                    <!-- 弹出层 -->
                    <Popup x:Name="PART_Popup"
                           AllowsTransparency="True"
                           Focusable="False"
                           IsOpen="{Binding IsDropDownOpen, Mode=TwoWay, RelativeSource={RelativeSource TemplatedParent}}"
                           Placement="Bottom"
                           PopupAnimation="{DynamicResource {x:Static SystemParameters.ComboBoxPopupAnimationKey}}">
                        <Border x:Name="dropDownBorder"
                                Background="{TemplateBinding Background}"
                                BorderBrush="#D0D0D0"
                                BorderThickness="1"
                                CornerRadius="0,0,4,4"
                                MaxHeight="{TemplateBinding MaxDropDownHeight}"
                                MinWidth="{Binding ActualWidth, ElementName=templateRoot}">
                            <ScrollViewer x:Name="DropDownScrollViewer">
                                <Grid x:Name="grid" RenderOptions.ClearTypeHint="Enabled">
                                    <Canvas x:Name="canvas" HorizontalAlignment="Left" Height="0"
                                            VerticalAlignment="Top" Width="0">
                                        <Rectangle x:Name="opaqueRect"
                                                   Fill="{Binding Background, ElementName=dropDownBorder}"
                                                   Height="{Binding ActualHeight, ElementName=dropDownBorder}"
                                                   Width="{Binding ActualWidth, ElementName=dropDownBorder}"/>
                                    </Canvas>
                                    <ItemsPresenter x:Name="ItemsPresenter"
                                                    KeyboardNavigation.DirectionalNavigation="Contained"
                                                    SnapsToDevicePixels="{TemplateBinding SnapsToDevicePixels}"/>
                                </Grid>
                            </ScrollViewer>
                        </Border>
                    </Popup>

                    <!-- 切换按钮（触发下拉） -->
                    <ToggleButton x:Name="toggleButton"
                                  BorderBrush="{TemplateBinding BorderBrush}"
                                  BorderThickness="{TemplateBinding BorderThickness}"
                                  Background="{TemplateBinding Background}"
                                  Focusable="False"
                                  IsChecked="{Binding IsDropDownOpen, Mode=TwoWay, RelativeSource={RelativeSource TemplatedParent}}"
                                  ClickMode="Press"
                                  SnapsToDevicePixels="True">
                        <ToggleButton.Template>
                            <ControlTemplate TargetType="ToggleButton">
                                <Border x:Name="toggleBorder"
                                        Background="{TemplateBinding Background}"
                                        BorderBrush="{TemplateBinding BorderBrush}"
                                        BorderThickness="{TemplateBinding BorderThickness}"
                                        CornerRadius="4"
                                        SnapsToDevicePixels="True">
                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="30"/>
                                        </Grid.ColumnDefinitions>

                                        <ContentPresenter x:Name="contentPresenter"
                                                          Grid.Column="0"
                                                          Margin="12,0,0,0"
                                                          HorizontalAlignment="Left"
                                                          VerticalAlignment="Center"
                                                          Content="{TemplateBinding Content}"
                                                          ContentTemplate="{TemplateBinding ContentTemplate}"
                                                          RecognizesAccessKey="True"
                                                          SnapsToDevicePixels="{TemplateBinding SnapsToDevicePixels}"/>

                                        <!-- 下拉箭头 -->
                                        <Path x:Name="arrow"
                                              Grid.Column="1"
                                              Data="M0,0 L4,4 L8,0"
                                              Fill="#666666"
                                              HorizontalAlignment="Center"
                                              VerticalAlignment="Center"
                                              SnapsToDevicePixels="True"/>
                                    </Grid>
                                </Border>

                                <ControlTemplate.Triggers>
                                    <Trigger Property="IsMouseOver" Value="True">
                                        <Setter TargetName="arrow" Property="Fill" Value="#0078D4"/>
                                    </Trigger>
                                    <Trigger Property="IsChecked" Value="True">
                                        <Setter TargetName="arrow" Property="Fill" Value="#0078D4"/>
                                        <Setter TargetName="arrow" Property="RenderTransform">
                                            <Setter.Value>
                                                <RotateTransform Angle="180"/>
                                            </Setter.Value>
                                        </Setter>
                                    </Trigger>
                                </ControlTemplate.Triggers>
                            </ControlTemplate>
                        </ToggleButton.Template>
                    </ToggleButton>

                    <!-- 可编辑模式下的文本框 -->
                    <TextBox x:Name="PART_EditableTextBox"
                             HorizontalContentAlignment="{TemplateBinding HorizontalContentAlignment}"
                             VerticalContentAlignment="{TemplateBinding VerticalContentAlignment}"
                             Margin="{TemplateBinding Padding}"
                             Visibility="Collapsed"
                             Focusable="True"
                             Background="{TemplateBinding Background}"
                             Foreground="{TemplateBinding Foreground}"
                             CaretBrush="{TemplateBinding Foreground}"
                             IsReadOnly="{TemplateBinding IsReadOnly}"/>
                </Grid>

                <ControlTemplate.Triggers>
                    <!-- 可编辑模式 -->
                    <Trigger Property="IsEditable" Value="True">
                        <Setter TargetName="PART_EditableTextBox" Property="Visibility" Value="Visible"/>
                        <Setter TargetName="toggleButton" Property="Visibility" Value="Collapsed"/>
                    </Trigger>

                    <!-- 禁用状态 -->
                    <Trigger Property="IsEnabled" Value="False">
                        <Setter TargetName="templateRoot" Property="Opacity" Value="0.5"/>
                    </Trigger>

                    <!-- 分组样式 -->
                    <Trigger Property="IsGrouping" Value="True">
                        <Setter Property="ScrollViewer.CanContentScroll" Value="False"/>
                    </Trigger>
                </ControlTemplate.Triggers>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

> **重要**：ComboBox 模板**必须**包含 `PART_Popup`（Popup）和 `PART_EditableTextBox`（TextBox），否则下拉和编辑功能将不可用。

---

## 11. 最佳实践与常见陷阱

### 11.1 最佳实践

| 实践 | 说明 |
|------|------|
| **使用 VisualStateManager** | VSM 比传统的 Property Trigger 更清晰、更易于维护，且支持动画过渡。 |
| **TemplateBinding 优化** | 在不需要双向绑定的场景下优先使用 `TemplateBinding`，性能优于完整 `Binding`。 |
| **SnapsToDevicePixels** | 在 Border 等容器上启用，防止亚像素渲染导致模糊。 |
| **RecognizesAccessKey** | 在 ContentPresenter 上启用，使 Content 中的访问键（Alt+字母）正常工作。 |
| **IsHitTestVisible="False"** | 装饰性元素（投影、水印等）应设为不命中测试，避免干扰交互。 |
| **UseLayoutRounding** | 在可能产生非整数尺寸的布局上启用。 |
| **模板复用** | 将通用模板提取到 ResourceDictionary 中，通过 `BasedOn` 或 `StaticResource` 复用。 |
| **保持 ContentPresenter** | 对于 ContentControl 子类，始终保留 ContentPresenter 以支持内容显示。 |
| **资源提取** | 将颜色、尺寸等提取为独立的资源（如 `{StaticResource PrimaryColor}`），方便主题切换。 |

### 11.2 常见陷阱

| 陷阱 | 问题 | 解决方案 |
|------|------|---------|
| **忘记 PART_ 元素** | 控件功能异常（TextBox 不可输入、ComboBox 不下拉等） | 查看控件文档，确保包含所有必需的 PART_ 元素 |
| **TemplateBinding 替换** | 丢失原始模板中的关键属性映射 | 复制默认模板后，保留所有 TemplateBinding，只修改视觉 |
| **ContentPresenter 遗漏属性** | 内容对齐、访问键等功能失效 | 确保 Margin、HorizontalAlignment、RecognizesAccessKey 等属性正确绑定 |
| **过度使用 TemplateBinding** | 代码冗余 | 对于固定值直接用字面量，不用 TemplateBinding |
| **Trigger 冲突** | VSM 动画和 Property Trigger 互相覆盖 | 优先使用 VSM，只在简单场景使用 Property Trigger |
| **忽略 IsReadOnly/IsEnabled** | 只读/禁用状态下外观无变化 | 为新模板添加 ReadOnly 和 Disabled 的 VisualState |
| **Adorner 层忽略** | 验证错误红框等 Adorner 效果不可见 | 确保模板中的 `AdornerDecorator` 或理解 Adorner 与 Template 的关系 |
| **性能问题（复杂动画）** | VSM 中复杂的 Storyboard 导致性能下降 | 限制动画的持续时间和属性数量，在 `Duration="0"` 的场景直接使用属性赋值 |

### 11.3 获取控件默认模板

自定义模板的最佳起点是获取控件的**默认模板**进行修改：

```csharp
// 方法 1：通过代码获取默认模板的 XAML
using (var stream = typeof(Button).Assembly.GetManifestResourceStream(
    "PresentationFramework.Aero2.NormalColor.xaml"))  // 主题名称因系统而异
{
    // 加载并查找目标控件的 Style/Template
}

// 方法 2：使用 Visual Studio 的设计时功能
// 在 XAML 设计器中右键控件 → "编辑模板" → "编辑副本..."

// 方法 3：使用 Blend for Visual Studio
// 右键控件 → "编辑模板" → "编辑当前"
```

### 11.4 模板继承与 BasedOn

```xml
<!-- 基础按钮样式 -->
<Style x:Key="BaseButtonStyle" TargetType="Button">
    <Setter Property="Padding" Value="12,6"/>
    <Setter Property="FontSize" Value="14"/>
</Style>

<!-- 继承基础样式，仅修改颜色 -->
<Style x:Key="PrimaryButtonStyle" 
       TargetType="Button" 
       BasedOn="{StaticResource BaseButtonStyle}">
    <Setter Property="Background" Value="#0078D4"/>
    <Setter Property="Foreground" Value="White"/>
</Style>

<!-- 继承基础样式，修改为危险按钮 -->
<Style x:Key="DangerButtonStyle" 
       TargetType="Button" 
       BasedOn="{StaticResource BaseButtonStyle}">
    <Setter Property="Background" Value="#E81123"/>
    <Setter Property="Foreground" Value="White"/>
</Style>
```

### 11.5 VSM vs Trigger 选择指南

```
使用 VisualStateManager：
  ✓ 需要动画过渡效果
  ✓ 状态之间有明确的切换逻辑
  ✓ 多个视觉状态组共存（如同时有 CommonStates 和 FocusStates）
  ✓ 新项目或新模板

使用 Trigger：
  ✓ 简单的属性映射，不需要动画
  ✓ 基于数据绑定的状态变化（DataTrigger）
  ✓ 老项目兼容性考虑
  ✓ 状态逻辑简单，只有一两个条件
```

---

## 参考资源

- [MSDN: ControlTemplate Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.controltemplate)
- [MSDN: Control Styles and Templates](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/controls/control-styles-and-templates)
- [MSDN: VisualStateManager Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.visualstatemanager)
- [WPF 默认控件模板](https://github.com/dotnet/wpf/tree/main/src/Microsoft.DotNet.Wpf/src/Themes)
