---
title: "大模型训练数据清洗流程详解"
date: "2026-05-28"
updated: "2026-05-28"
summary: "介绍大模型训练数据中的去重、质量过滤、敏感信息识别和格式化流程"
tags: ["LLM", "数据清洗", "大模型数据工程"]
category: "大模型数据工程"
draft: false
---

## 数据清洗的重要性

在大模型训练过程中，数据质量直接决定了模型的表现。低质量的训练数据会导致模型产生不准确、有偏见甚至有害的输出。因此，构建一套完整的数据清洗流程是大模型数据工程的核心环节。

## 数据读取

首先需要从多个数据源读取原始数据，常见的数据源包括：

- 网页爬取数据
- 开源数据集
- 企业内部数据
- 多模态数据（文本、图像、音频等）

```python
import pandas as pd

def load_data(source: str) -> pd.DataFrame:
    """从不同数据源加载数据"""
    if source.endswith(".csv"):
        return pd.read_csv(source)
    elif source.endswith(".json"):
        return pd.read_json(source, lines=True)
    elif source.endswith(".parquet"):
        return pd.read_parquet(source)
    else:
        raise ValueError(f"Unsupported format: {source}")
```

## 数据去重

数据去重是清洗流程中的关键步骤，主要包括：

### 文档级去重

通过 MinHash + LSH 算法实现海量文本的近似重复检测。对于亿级文档，可以在数小时内完成去重。

```python
from datasketch import MinHash, MinHashLSH

def compute_minhash(text: str, num_perm: int = 128) -> MinHash:
    """计算文本的 MinHash 签名"""
    m = MinHash(num_perm=num_perm)
    for word in text.split():
        m.update(word.encode("utf-8"))
    return m
```

### 段落级去重

在文档内部进行段落级别的精确去重，消除重复的段落和模板化内容。

## 质量过滤

### 规则过滤

基于预设规则过滤低质量内容：

1. **长度过滤**：去除过短或过长的文本
2. **语言识别**：使用 fastText 识别文本语言
3. **特殊字符比例**：过滤包含过多特殊字符的文本
4. **重复行比例**：过滤包含大量重复行的文本

### 模型过滤

使用分类模型对文本质量进行评分，过滤低质量内容：

```python
import fasttext

# 加载预训练模型
model = fasttext.load_model("lid.176.bin")

def detect_language(text: str) -> str:
    """检测文本语言"""
    predictions = model.predict(text.replace("\n", " "))
    return predictions[0][0].replace("__label__", "")
```

## 敏感信息识别

识别并脱敏处理文本中的个人信息：

- 姓名
- 电话号码
- 邮箱地址
- 身份证号
- 银行卡号

```python
import re

def mask_pii(text: str) -> str:
    """脱敏个人信息"""
    # 邮箱
    text = re.sub(r"[\w.-]+@[\w.-]+\.\w+", "[EMAIL]", text)
    # 手机号
    text = re.sub(r"1[3-9]\d{9}", "[PHONE]", text)
    # 身份证
    text = re.sub(r"\d{17}[\dXx]", "[ID_CARD]", text)
    return text
```

## 格式化输出

最终将清洗后的数据转换为训练所需的格式：

```json
{
  "messages": [
    { "role": "user", "content": "什么是大模型数据清洗？" },
    { "role": "assistant", "content": "大模型数据清洗是指..." }
  ]
}
```

## 总结

大模型训练数据清洗是一个系统性工程，需要从多个维度保证数据质量。通过规则过滤、模型过滤、去重和脱敏等手段，可以构建一套完整的自动化数据清洗流程，为大模型训练提供高质量的数据基础。
