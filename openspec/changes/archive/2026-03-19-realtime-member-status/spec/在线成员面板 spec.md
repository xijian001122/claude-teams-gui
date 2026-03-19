# member状态同步

### online成员面板

#### 2. 成员状态指示器

- 显示成员列表（按状态分组）
- 显示成员头像（头像+ 煘"正在处理..."任务描述（如果有的）
- 显示"空闲中"状态
- 显示最后活动时间
- 成{ { -->

  ### Requirement: 在线成员面板
  用户可点击触发器， 展开下拉面板， 显示成员详情和当前任务描述
  - 显示最后活动时间（如果有)
  - 显示最后活动时间
  - 支持按状态筛选
- ```

  ]
}
```

### Requirement: 点击展开面板
用户可点击触发器， 展开下拉面板并显示成员列表

成员点击外部自动关闭面板

  - 颜色： 緝色 ) else {
    ```

  }
}
}
  - 按住 name 猉展开/收起面板
}
</section>
```

} else {
  ```
`
}
}
  const memberItem = document.querySelector {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #d1d5e1e1 5px;
            flex: 1;
            gap: 4px;
        }
      `
    }
  });
  position: relative;
}

  .online-trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    line-height: 1.2;
  }

`

  .online-trigger {
    padding: 6px 14px;
    background: #f3f4f6;
    border-radius: 20px;
    font-weight: 600;
            box-shadow: 0 2px 8px 0 16px;
            transition: background 0.2s;
          }
        }
      }
    };
  }
  .online-panel {
    position: absolute;
    top: calc(100% + 8px);
    max-width: 320px;
            background: white;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 8px 0 16px;
          }
        }
      }
    }
  }

  .member-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .member-time {
    font-size: 12px;
    color: #6b7280;
    white: 0;
            align-items: center;
          }
          .member-item:hover {
            background: #f3f4f6;
            cursor: pointer;
          }
        }
      }
    };
  }
}
</style>
<style>
/* 成员头像 */
.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  position: relative;
}

.member-info {
  flex: 1;
}

.member-time {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  white-space: nowrap;
}
</style>
</head>
<body>
</html>