import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, Input, Select, Button, Space, Card, Typography, Popconfirm, Divider, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CodeOutlined, FolderAddOutlined } from '@ant-design/icons';

const { Text } = Typography;

const FIELD_TYPES = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Nested', value: 'object' },
];

// Utility: create a new field node
const createField = (overrides = {}) => ({
  id: crypto.randomUUID(),
  key: 'fieldName',
  type: 'string',
  children: [],
  ...overrides,
});

const defaultValueForType = (type) => {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'object':
      return {};
    default:
      return null;
  }
};

const buildJson = (fields) => {
  const obj = {};
  fields.forEach(f => {
    if (!f.key) return;
    if (f.type === 'object') {
      obj[f.key] = buildJson(f.children || []);
    } else {
      obj[f.key] = defaultValueForType(f.type);
    }
  });
  return obj;
};

const FieldRow = ({
  node,
  depth,
  onChangeKey,
  onChangeType,
  onAddSibling,
  onAddChild,
  onDelete,
}) => {
  const isObject = node.type === 'object';
  return (
    <div
      style={{
        borderLeft: depth ? '2px solid #e5e5e5' : 'none',
        marginLeft: depth ? 12 : 0,
        paddingLeft: depth ? 12 : 0,
        marginTop: 8,
      }}
    >
      <Card
        size="small"
        bodyStyle={{ padding: '8px 8px' }}
        style={{ background: isObject ? '#fafafa' : '#fff' }}
      >
        <Space align="start" wrap>
          <Input
            placeholder="key"
            value={node.key}
            onChange={(e) => onChangeKey(node.id, e.target.value)}
            style={{ width: 160 }}
            size="small"
          />
          <Select
            value={node.type}
            onChange={(val) => onChangeType(node.id, val)}
            size="small"
            style={{ width: 120 }}
            options={FIELD_TYPES}
          />
          <Space size={4}>
            <Tooltip title="Add sibling field">
              <Button
                icon={<PlusOutlined />}
                size="small"
                type="dashed"
                onClick={() => onAddSibling(node.id)}
              />
            </Tooltip>
            {isObject && (
              <Tooltip title="Add nested field">
                <Button
                  icon={<FolderAddOutlined />}
                  size="small"
                  type="dashed"
                  onClick={() => onAddChild(node.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Delete this field?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => onDelete(node.id)}
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
        </Space>

        {isObject && node.children?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {node.children.map(child => (
              <FieldRow
                key={child.id}
                node={child}
                depth={depth + 1}
                onChangeKey={onChangeKey}
                onChangeType={onChangeType}
                onAddSibling={onAddSibling}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {isObject && node.children?.length === 0 && (
          <div style={{ marginTop: 8 }}>
            <Button
              size="small"
              type="link"
              onClick={() => onAddChild(node.id)}
            >
              + Add first nested field
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

const SchemaBuilder = () => {
  const [fields, setFields] = useState([
    createField({ key: 'name', type: 'string' }),
    createField({ key: 'age', type: 'number' }),
    createField({ key: 'profile', type: 'object', children: [createField({ key: 'bio', type: 'string' })] }),
  ]);
  const [activeTab, setActiveTab] = useState('builder');

  const updateTree = useCallback((updater) => {
    setFields(prev => {
      const clone = structuredClone(prev);
      updater(clone);
      return clone;
    });
  }, []);

  const findAndOperate = (list, id, cb, parentListRef) => {
    for (let i = 0; i < list.length; i++) {
      const node = list[i];
      if (node.id === id) {
        cb(list, i, node, parentListRef);
        return true;
      }
      if (node.type === 'object' && node.children?.length) {
        if (findAndOperate(node.children, id, cb, list)) return true;
      }
    }
    return false;
  };

  const handleChangeKey = (id, keyVal) => {
    updateTree((tree) => {
      findAndOperate(tree, id, (arr, idx) => {
        arr[idx].key = keyVal.replace(/\\s+/g, '_');
      });
    });
  };

  const handleChangeType = (id, newType) => {
    updateTree((tree) => {
      findAndOperate(tree, id, (arr, idx) => {
        const node = arr[idx];
        node.type = newType;
        if (newType === 'object') {
          node.children = node.children || [];
        } else {
          delete node.children;
        }
      });
    });
  };

  const handleAddRoot = () => {
    setFields(prev => [...prev, createField()]);
  };

  const handleAddSibling = (id) => {
    updateTree((tree) => {
      findAndOperate(tree, id, (arr, idx) => {
        arr.splice(idx + 1, 0, createField());
      });
    });
  };

  const handleAddChild = (id) => {
    updateTree((tree) => {
      findAndOperate(tree, id, (arr, idx) => {
        const node = arr[idx];
        if (node.type !== 'object') return;
        node.children.push(createField());
      });
    });
  };

  const handleDelete = (id) => {
    updateTree((tree) => {
      findAndOperate(tree, id, (arr, idx) => {
        arr.splice(idx, 1);
      });
    });
  };

  const jsonPreview = useMemo(() => buildJson(fields), [fields]);

  return (
    <Card
      title="JSON Schema Builder"
      extra={<Text type="secondary" style={{ fontSize: 12 }}>String | Number | Nested(Object)</Text>}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'builder',
            label: <span><CodeOutlined /> Builder</span>,
            children: (
            <div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRoot}
                  >
                    Add Field
                  </Button>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  {fields.length === 0 && (
                    <Text type="secondary">No fields yet. Click "Add Field".</Text>
                  )}
                  {fields.map(f => (
                    <FieldRow
                      key={f.id}
                      node={f}
                      depth={0}
                      onChangeKey={handleChangeKey}
                      onChangeType={handleChangeType}
                      onAddSibling={handleAddSibling}
                      onAddChild={handleAddChild}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </Space>
            </div>
          )
        },
        {
          key: 'json',
          label: <span><CodeOutlined /> JSON</span>,
          children: (
            <pre
              style={{
                background: '#111',
                color: '#0f0',
                padding: 16,
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 500,
                overflow: 'auto'
              }}
            >
{JSON.stringify(jsonPreview, null, 2)}
            </pre>
          )
        }
      ]} />
    </Card>
  );
};

export default SchemaBuilder;
