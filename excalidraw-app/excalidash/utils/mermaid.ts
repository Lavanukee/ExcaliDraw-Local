// @ts-nocheck
import { ExcalidrawElement, ExcalidrawLinearElement, ExcalidrawTextElement } from '@excalidraw/excalidraw';

export function convertToMermaid(elements: readonly ExcalidrawElement[]): string {
  let mermaidCode = 'flowchart TB\n';
  
  // Track node details
  type NodeData = {
    id: string;
    type: string;
    label: string;
    bg: string;
    stroke: string;
    color: string;
    isSubgraph: boolean;
    parentId: string | null;
  };
  const nodes = new Map<string, NodeData>();

  // Dictionaries by type
  const textElMap = new Map<string, ExcalidrawTextElement>();
  elements.forEach(el => {
    if (el.type === 'text') {
      textElMap.set(el.id, el as ExcalidrawTextElement);
    }
  });

  const arrows = elements.filter(el => 
    (el.type === 'arrow' || el.type === 'line') && 
    (el as ExcalidrawLinearElement).startBinding && 
    (el as ExcalidrawLinearElement).endBinding
  ) as ExcalidrawLinearElement[];
  
  const shapes = elements.filter(el => ['rectangle', 'diamond', 'ellipse'].includes(el.type));
  
  // Helper: Determine if 'child' is completely contained within 'container'
  const isContained = (container: ExcalidrawElement, child: ExcalidrawElement) => {
    return child.x > container.x && 
           child.y > container.y && 
           (child.x + child.width) < (container.x + container.width) && 
           (child.y + child.height) < (container.y + container.height);
  };

  // Build containment tree
  // For each shape, what is its smallest containing parent?
  const parentMap = new Map<string, string>(); // child ID -> container ID
  const subgraphs = new Set<string>();

  shapes.forEach(container => {
    if (container.type === 'rectangle') {
      const children = elements.filter(el => 
        el.id !== container.id && 
        el.type !== 'arrow' && 
        el.type !== 'line' &&
        isContained(container, el)
      );
      
      // If it contains shapes or standalone texts, it might be a subgraph.
      const hasShapeChildren = children.some(c => ['rectangle', 'diamond', 'ellipse'].includes(c.type));
      if (hasShapeChildren) {
        subgraphs.add(container.id);
        children.forEach(child => {
          if (parentMap.has(child.id)) {
            const currentParentId = parentMap.get(child.id)!;
            const currentParent = shapes.find(s => s.id === currentParentId);
            if (currentParent && (container.width * container.height < currentParent.width * currentParent.height)) {
               parentMap.set(child.id, container.id);
            }
          } else {
            parentMap.set(child.id, container.id);
          }
        });
      }
    }
  });

  // Extract nodes
  elements.forEach(el => {
    if (el.type === 'arrow' || el.type === 'line') return;

    if (['rectangle', 'diamond', 'ellipse'].includes(el.type)) {
      const isSubgraph = subgraphs.has(el.id);
      
      let label = "";
      const boundTextId = el.boundElements?.find((b: any) => b.type === 'text')?.id;
      if (boundTextId && textElMap.has(boundTextId)) {
        label = textElMap.get(boundTextId)!.text.replace(/\n/g, '<br/>');
      }

      // If it's a subgraph and has no bound text natively, check if there's a loose text element right near the top inside it
      if (isSubgraph && !label) {
        const textsInside = Array.from(textElMap.values()).filter(t => parentMap.get(t.id) === el.id);
        const topText = textsInside.sort((a,b) => a.y - b.y)[0];
        if (topText && topText.y < el.y + 60) {
          label = topText.text.replace(/\n/g, '<br/>');
          // Since it acts as a title, we don't render it as a separate node
          parentMap.delete(topText.id);
        }
      }

      // Clean ID for mermaid (no hyphens or weird chars)
      const cleanId = 'node_' + el.id.replace(/[^a-zA-Z0-9]/g, '');

      nodes.set(el.id, {
        id: cleanId,
        type: el.type,
        label: label || (isSubgraph ? '' : ' '), // mermaid errors on empty string labels for nodes
        bg: el.backgroundColor === 'transparent' ? 'none' : el.backgroundColor,
        stroke: el.strokeColor === 'transparent' ? 'none' : el.strokeColor,
        color: el.strokeColor, // We'll just use strokeColor or black
        isSubgraph,
        parentId: parentMap.get(el.id) || null
      });
    } else if (el.type === 'text') {
      // Is this text bound to anything?
      const isBound = shapes.some(s => s.boundElements?.some((b: any) => b.id === el.id));
      const isEdgeLabel = arrows.some(a => a.boundElements?.some((b: any) => b.id === el.id));

      if (!isBound && !isEdgeLabel && parentMap.get(el.id) !== undefined) { // Meaning we didn't skip it
        const cleanId = 'node_' + el.id.replace(/[^a-zA-Z0-9]/g, '');
        nodes.set(el.id, {
          id: cleanId,
          type: 'text',
          label: (el as ExcalidrawTextElement).text.replace(/\n/g, '<br/>'),
          bg: 'none',
          stroke: 'none',
          color: el.strokeColor,
          isSubgraph: false,
          parentId: parentMap.get(el.id) || null
        });
      }
    }
  });

  const getShapeStr = (type: string, label: string) => {
    if (type === 'diamond') return `{${label}}`;
    if (type === 'ellipse') return `([${label}])`;
    if (type === 'text') return `[${label}]`;
    return `[${label}]`; // rectangle
  };

  const getStyleStr = (id: string, node: NodeData) => {
    const fillStr = node.bg ? `fill:${node.bg}` : `fill:none`;
    const strokeStr = node.stroke ? `stroke:${node.stroke}` : `stroke:none`;
    const colorStr = node.color ? `color:${node.color}` : `color:#000`;
    return `style ${id} ${fillStr},${strokeStr},${colorStr},stroke-width:2px`;
  };

  const renderNode = (id: string, node: NodeData, indent: string): string => {
    if (node.isSubgraph) {
      let out = `${indent}subgraph ${node.id} [${node.label}]\n`;
      const children = Array.from(nodes.entries()).filter(([_, n]) => n.parentId === id);
      children.forEach(([cId, cNode]) => {
        out += renderNode(cId, cNode, indent + '  ');
      });
      out += `${indent}end\n`;
      out += `${indent}${getStyleStr(node.id, node)}\n`;
      return out;
    } else {
      let out = `${indent}${node.id}${getShapeStr(node.type, node.label)}\n`;
      out += `${indent}${getStyleStr(node.id, node)}\n`;
      return out;
    }
  };

  // Render all top-level nodes
  const rootNodes = Array.from(nodes.entries()).filter(([_, n]) => !n.parentId);
  rootNodes.forEach(([id, node]) => {
    mermaidCode += renderNode(id, node, '  ');
  });

  // Render edges
  arrows.forEach(arrow => {
    const startId = arrow.startBinding?.elementId;
    const endId = arrow.endBinding?.elementId;
    
    if (startId && endId && nodes.has(startId) && nodes.has(endId)) {
      const startNode = nodes.get(startId)!;
      const endNode = nodes.get(endId)!;
      
      let label = "";
      const textId = arrow.boundElements?.find((b: any) => b.type === 'text')?.id;
      if (textId && textElMap.has(textId)) {
        label = `|${textElMap.get(textId)!.text.replace(/\n/g, '<br/>')}|`;
      }
      
      mermaidCode += `  ${startNode.id} --> ${label} ${endNode.id}\n`;
    }
  });

  return mermaidCode;
}
