import React, { useState, useCallback } from 'react';
import { 
  Type, 
  Image, 
  Film, 
  HelpCircle, 
  FileText, 
  List, 
  CheckSquare, 
  ExternalLink,
  Code,
  AlertTriangle,
  Eye,
  Save,
  Settings
} from 'lucide-react';
import RoadSignBlock from './blocks/RoadSignBlock';
import ScenarioBlock from './blocks/ScenarioBlock';
import ContentPreview from './ContentPreview';

interface BlockEditorProps {
  initialContent?: Block[];
  onChange?: (blocks: Block[]) => void;
  readOnly?: boolean;
  showPreview?: boolean;
}

interface Block {
  id: string;
  type: 'text' | 'image' | 'video' | 'quiz' | 'file' | 'road_sign' | 'scenario' | 'checklist' | 'call_to_action' | 'embed';
  content: any;
}

const BLOCK_TYPES = [
  { type: 'text', icon: <Type size={18} />, label: 'Text' },
  { type: 'image', icon: <Image size={18} />, label: 'Image' },
  { type: 'video', icon: <Film size={18} />, label: 'Video' },
  { type: 'quiz', icon: <HelpCircle size={18} />, label: 'Quiz' },
  { type: 'file', icon: <FileText size={18} />, label: 'File' },
  { type: 'road_sign', icon: <AlertTriangle size={18} />, label: 'Road Sign' },
  { type: 'scenario', icon: <List size={18} />, label: 'Scenario' },
  { type: 'checklist', icon: <CheckSquare size={18} />, label: 'Checklist' },
  { type: 'call_to_action', icon: <ExternalLink size={18} />, label: 'Call to Action' },
  { type: 'embed', icon: <Code size={18} />, label: 'Embed' }
];

const BlockEditor: React.FC<BlockEditorProps> = ({
  initialContent = [],
  onChange,
  readOnly = false,
  showPreview = false
}) => {
  const [blocks, setBlocks] = useState<Block[]>(initialContent);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const handleAddBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContentForType(type)
    };

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    setActiveBlockId(newBlock.id);
    onChange?.(updatedBlocks);
  };

  const handleUpdateBlock = (id: string, content: any) => {
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, content } : block
    );
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  };

  const handleRemoveBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    setBlocks(updatedBlocks);
    setActiveBlockId(null);
    onChange?.(updatedBlocks);
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (
      (direction === 'up' && blockIndex === 0) || 
      (direction === 'down' && blockIndex === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    // Swap blocks
    [newBlocks[blockIndex], newBlocks[targetIndex]] = 
    [newBlocks[targetIndex], newBlocks[blockIndex]];
    
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const getDefaultContentForType = (type: Block['type']) => {
    switch (type) {
      case 'text':
        return { text: '', formatting: 'paragraph' };
      case 'image':
        return { imageUrl: '', caption: '', altText: '' };
      case 'video':
        return { videoUrl: '', caption: '' };
      case 'quiz':
        return { question: '', options: [], correctAnswer: null };
      case 'file':
        return { fileUrl: '', title: '', description: '' };
      case 'road_sign':
        return { signId: '', description: '', showMeaning: true, interactive: false };
      case 'scenario':
        return { scenarioType: '', description: '', interactive: true };
      case 'checklist':
        return { title: '', items: [] };
      case 'call_to_action':
        return { text: '', url: '', buttonText: '' };
      case 'embed':
        return { embedCode: '', caption: '' };
      default:
        return {};
    }
  };

  const renderBlockContent = (block: Block) => {
    switch (block.type) {
      case 'road_sign':
        return (
          <RoadSignBlock
            content={block.content}
            onChange={(content) => handleUpdateBlock(block.id, content)}
            readOnly={readOnly}
          />
        );
      
      case 'scenario':
        return (
          <ScenarioBlock
            content={block.content}
            onChange={(content) => handleUpdateBlock(block.id, content)}
            readOnly={readOnly}
          />
        );

      case 'text':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              value={block.content.text}
              placeholder="Enter text content..."
              readOnly={readOnly}
              onChange={(e) => handleUpdateBlock(block.id, { ...block.content, text: e.target.value })}
              rows={4}
            />
            {!readOnly && (
              <div className="mt-2">
                <select 
                  className="p-2 border border-gray-300 rounded-md text-sm"
                  value={block.content.formatting}
                  onChange={(e) => handleUpdateBlock(block.id, { ...block.content, formatting: e.target.value })}
                >
                  <option value="paragraph">Paragraph</option>
                  <option value="heading1">Heading 1</option>
                  <option value="heading2">Heading 2</option>
                  <option value="heading3">Heading 3</option>
                  <option value="quote">Quote</option>
                </select>
              </div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            {!readOnly && (
              <input
                className="w-full p-2 mb-2 border border-gray-300 rounded-md"
                value={block.content.imageUrl}
                placeholder="Enter image URL..."
                onChange={(e) => handleUpdateBlock(block.id, { ...block.content, imageUrl: e.target.value })}
              />
            )}
            {block.content.imageUrl && (
              <div className="mt-2 relative">
                <img 
                  src={block.content.imageUrl} 
                  alt={block.content.altText || 'Image'} 
                  className="w-full rounded-md max-h-96 object-cover"
                />
                {block.content.caption && (
                  <p className="mt-2 text-sm text-gray-600 italic text-center">{block.content.caption}</p>
                )}
              </div>
            )}
            {!readOnly && (
              <>
                <input
                  className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                  value={block.content.caption}
                  placeholder="Image caption (optional)..."
                  onChange={(e) => handleUpdateBlock(block.id, { ...block.content, caption: e.target.value })}
                />
                <input
                  className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                  value={block.content.altText}
                  placeholder="Alt text (for accessibility)..."
                  onChange={(e) => handleUpdateBlock(block.id, { ...block.content, altText: e.target.value })}
                />
              </>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            {!readOnly && (
              <input
                className="w-full p-2 mb-2 border border-gray-300 rounded-md"
                value={block.content.videoUrl}
                placeholder="Enter video URL (YouTube, Vimeo, etc.)..."
                onChange={(e) => handleUpdateBlock(block.id, { ...block.content, videoUrl: e.target.value })}
              />
            )}
            {block.content.videoUrl && (
              <div className="mt-2 aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <Film size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Video Player</p>
                  <p className="text-xs text-gray-400">{block.content.videoUrl}</p>
                </div>
              </div>
            )}
            {!readOnly && (
              <input
                className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                value={block.content.caption}
                placeholder="Video caption (optional)..."
                onChange={(e) => handleUpdateBlock(block.id, { ...block.content, caption: e.target.value })}
              />
            )}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
              <div className="flex items-center">
                <HelpCircle size={20} className="text-primary-500 mr-2" />
                <span className="font-medium">Quiz Question</span>
              </div>
              {!readOnly && (
                <input
                  className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                  value={block.content.question}
                  placeholder="Enter quiz question..."
                  onChange={(e) => handleUpdateBlock(block.id, { ...block.content, question: e.target.value })}
                />
              )}
              {block.content.question && <p className="mt-2">{block.content.question}</p>}
            </div>
          </div>
        );

      case 'checklist':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-3">
                <CheckSquare size={20} className="text-green-500 mr-2" />
                <span className="font-medium">Checklist</span>
              </div>
              {!readOnly && (
                <input
                  className="w-full p-2 mb-3 border border-gray-300 rounded-md"
                  value={block.content.title}
                  placeholder="Checklist title..."
                  onChange={(e) => handleUpdateBlock(block.id, { ...block.content, title: e.target.value })}
                />
              )}
              {block.content.title && <h4 className="font-medium mb-2">{block.content.title}</h4>}
              <div className="space-y-2">
                {(block.content.items || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newItems = [...(block.content.items || []), 'New item'];
                      handleUpdateBlock(block.id, { ...block.content, items: newItems });
                    }}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    + Add item
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'call_to_action':
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-md text-center">
              {!readOnly && (
                <div className="space-y-2 mb-4">
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={block.content.text}
                    placeholder="Call to action text..."
                    onChange={(e) => handleUpdateBlock(block.id, { ...block.content, text: e.target.value })}
                  />
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={block.content.url}
                    placeholder="URL..."
                    onChange={(e) => handleUpdateBlock(block.id, { ...block.content, url: e.target.value })}
                  />
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={block.content.buttonText}
                    placeholder="Button text..."
                    onChange={(e) => handleUpdateBlock(block.id, { ...block.content, buttonText: e.target.value })}
                  />
                </div>
              )}
              {block.content.text && <p className="text-primary-800 mb-3">{block.content.text}</p>}
              {block.content.buttonText && (
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {block.content.buttonText}
                </button>
              )}
            </div>
          </div>
        );
        
      // Placeholder renderers for other block types
      default:
        return (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <div className="flex items-center justify-center h-20 bg-gray-100 rounded-md">
              <p className="text-gray-500">
                {block.type.charAt(0).toUpperCase() + block.type.slice(1).replace('_', ' ')} Block
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      {!readOnly && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content Editor</h3>
            <div className="flex items-center space-x-2">
              {showPreview && (
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </button>
              )}
              <button
                onClick={() => onChange?.(blocks)}
                className="flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save size={16} className="mr-2" />
                Save
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((blockType) => (
              <button
                key={blockType.type}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                onClick={() => handleAddBlock(blockType.type as Block['type'])}
              >
                <span className="text-gray-500">{blockType.icon}</span>
                <span>{blockType.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-4 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <Type className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content blocks yet</h3>
            {!readOnly && (
              <p className="text-sm text-gray-400">
                Click on any block type above to start building your lesson
              </p>
            )}
          </div>
        ) : (
          blocks.map((block, index) => (
            <div 
              key={block.id} 
              className={`relative group ${activeBlockId === block.id ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => !readOnly && setActiveBlockId(block.id)}
            >
              {renderBlockContent(block)}
              
              {!readOnly && activeBlockId === block.id && (
                <div className="absolute -right-12 top-0 h-full flex flex-col items-center justify-center gap-1">
                  <button
                    className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="p-1 bg-white rounded-full shadow hover:bg-red-100"
                    onClick={() => handleRemoveBlock(block.id)}
                    title="Delete block"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <ContentPreview
          content={blocks}
          title="Lesson Preview"
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default BlockEditor;