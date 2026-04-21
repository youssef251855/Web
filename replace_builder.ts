import { readFileSync, writeFileSync } from 'fs';

const file = 'app/builder/[id]/page.tsx';
let content = readFileSync(file, 'utf8');

const newBuilderElement = `function BuilderElement({ element, canvasRef, onSelect }: { element: PageElement, canvasRef: React.RefObject<HTMLDivElement | null>, onSelect: () => void }) {
  const { selectElement, selectedElementId, updateElement } = useBuilderStore();
  const isSelected = selectedElementId === element.id;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={canvasRef}
      onDragEnd={(e, info) => {
        updateElement(element.id, {
          position: {
            x: element.position.x + info.offset.x,
            y: element.position.y + info.offset.y,
          }
        });
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(element.id);
        onSelect();
      }}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        x: 0,
        y: 0,
      }}
      className={\`cursor-move \${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'}\`}
    >
      <Renderer elements={[element]} isBuilderMode={true} />
    </motion.div>
  );
}
`;

const startIndex = content.indexOf('function BuilderElement({ element');
if (startIndex !== -1) {
    const endIndex = content.indexOf('}\n', content.lastIndexOf('</motion.div>')) + 2;
    content = content.slice(0, startIndex) + newBuilderElement + content.slice(endIndex);
    writeFileSync(file, content);
    console.log("Successfully replaced BuilderElement");
} else {
    console.error("Could not find BuilderElement");
}
