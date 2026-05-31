---
title: "Spark 数据倾斜优化总结"
date: "2026-04-15"
updated: "2026-04-20"
summary: "总结 Spark 任务中常见的数据倾斜问题及解决方案，包括加盐聚合、随机前缀和两阶段聚合"
tags: ["Spark", "性能优化", "大数据开发"]
category: "大数据开发工程"
draft: false
---

## 什么是数据倾斜

数据倾斜是指在分布式计算中，某些分区的数据量远大于其他分区，导致部分任务执行时间过长，成为整个作业的瓶颈。

## 常见原因

1. **Join 倾斜**：大表与小表 Join 时，某个 key 的数据量特别大
2. **GroupBy 倾斜**：某个分组键的值分布极不均匀
3. **Distinct 倾斜**：去重操作中某个值出现频率极高

## 优化方案

### 方案一：Broadcast Join

当一张表足够小时，可以将其广播到所有 executor，避免 Shuffle：

```scala
import org.apache.spark.sql.functions.broadcast

val result = largeDF.join(broadcast(smallDF), "key")
```

### 方案二：加盐聚合

对于 GroupBy 倾斜，可以给 key 添加随机盐值，先做局部聚合再做全局聚合：

```scala
import org.apache.spark.sql.functions._

// 加盐
val salted = df.withColumn("salted_key", concat($"key", lit("_"), (rand() * 10).cast("int")))

// 局部聚合
val partial = salted.groupBy("salted_key").agg(sum("value") as "partial_sum")

// 去盐后全局聚合
val result = partial.withColumn("key", split($"salted_key", "_")(0))
  .groupBy("key")
  .agg(sum("partial_sum") as "total_sum")
```

### 方案三：过滤异常 Key

如果倾斜是由某个异常 key 引起的，可以将其单独处理：

```scala
val skewedKeys = Seq("null", "", "unknown")
val skewedDF = df.filter($"key".isin(skewedKeys: _*))
val normalDF = df.filter(!$"key".isin(skewedKeys: _*))

// 分别处理后再合并
```

## 监控与诊断

通过 Spark UI 可以直观地观察数据倾斜：

1. 查看 Stage 中各个 Task 的处理数据量
2. 对比 Task 的执行时间差异
3. 查看 Shuffle Read Size 分布

## 总结

数据倾斜是 Spark 调优中最常见的问题之一。解决思路主要包括：避免 Shuffle（Broadcast）、打散数据（加盐）、分离处理（过滤异常值）。在实际应用中，需要结合具体场景选择最合适的优化方案。
