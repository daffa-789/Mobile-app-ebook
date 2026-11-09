import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = 'E:/Wahidiyah Book Mobile app';
const FIGCRAFT_CLI = 'C:/Program Files/ArtCraft/FigCraft/figcraft-cli.exe';
const TARGET_FIGCRAFT = path.join(ROOT_DIR, 'Design APP.figcraft');
const EXPORTED_JSON = path.join(ROOT_DIR, 'dist/challenger_doc.json');

// Helper to convert fresh AST from .figcraft
function loadDocumentAst() {
  assert.ok(fs.existsSync(TARGET_FIGCRAFT), `Design APP.figcraft must exist at ${TARGET_FIGCRAFT}`);
  assert.ok(fs.existsSync(FIGCRAFT_CLI), `FigCraft CLI must exist at ${FIGCRAFT_CLI}`);

  // Re-export freshly to guarantee no stale cache
  execSync(`"${FIGCRAFT_CLI}" convert "${TARGET_FIGCRAFT}" "${EXPORTED_JSON}"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(EXPORTED_JSON, 'utf8');
  return JSON.parse(raw);
}

test('Challenger M1.1: Empirical Stress-Test & Boundary Verification of Design APP.figcraft', async (t) => {
  const doc = loadDocumentAst();

  await t.test('1. Document Global Integrity & Reference Consistency', () => {
    assert.ok(doc.pages && Array.isArray(doc.pages), 'doc.pages must be an array');
    assert.ok(doc.nodes && typeof doc.nodes === 'object', 'doc.nodes must be an object');

    // Check all parent -> child references exist in doc.nodes
    let brokenRefs = 0;
    const brokenList = [];
    for (const [nodeId, node] of Object.entries(doc.nodes)) {
      if (node.children && Array.isArray(node.children)) {
        for (const childId of node.children) {
          if (!doc.nodes[childId]) {
            brokenRefs++;
            brokenList.push({ parent: nodeId, missingChild: childId });
          }
        }
      }
    }
    assert.strictEqual(
      brokenRefs,
      0,
      `Found broken child references: ${JSON.stringify(brokenList)}`,
    );
  });

  await t.test('2. Mobile - Komponen (96 Components) Empirical Stress & AABB Overlap Test', () => {
    const pageId = doc.pages.find((id) => doc.nodes[id]?.name === 'Mobile - Komponen');
    assert.ok(pageId, 'Page "Mobile - Komponen" must exist in document');

    const page = doc.nodes[pageId];
    assert.strictEqual(
      page.children.length,
      96,
      `Expected exactly 96 components on Mobile - Komponen, found ${page.children.length}`,
    );

    const components = [];
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const childId of page.children) {
      const node = doc.nodes[childId];
      assert.ok(node, `Node ${childId} must exist in doc.nodes`);
      assert.strictEqual(
        node.type.toLowerCase(),
        'component',
        `Node ${childId} (${node.name}) must be of type component`,
      );

      assert.ok(
        typeof node.width === 'number' && node.width > 0,
        `Node ${childId} width must be > 0`,
      );
      assert.ok(
        typeof node.height === 'number' && node.height > 0,
        `Node ${childId} height must be > 0`,
      );

      assert.ok(
        Array.isArray(node.transform) && node.transform.length >= 6,
        `Node ${childId} (${node.name}) must have a valid 6-element affine transform`,
      );

      const x = node.transform[4];
      const y = node.transform[5];

      assert.ok(Number.isFinite(x), `Node ${childId} x coordinate must be finite`);
      assert.ok(Number.isFinite(y), `Node ${childId} y coordinate must be finite`);

      const box = {
        id: childId,
        name: node.name,
        x,
        y,
        w: node.width,
        h: node.height,
        x2: x + node.width,
        y2: y + node.height,
      };

      // Ensure coordinates are not at (0, 0)
      assert.ok(
        !(x === 0 && y === 0),
        `Component ${childId} ("${node.name}") is at uninitialized position (0, 0)`,
      );

      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x2);
      maxY = Math.max(maxY, box.y2);

      components.push(box);
    }

    // Canvas bounding box bounds check
    console.log(
      `\n[CHALLENGER] Mobile - Komponen Union Bounding Box: [${minX}, ${minY}] to [${maxX}, ${maxY}]`,
    );
    console.log(`[CHALLENGER] Dimensions: width=${maxX - minX}px, height=${maxY - minY}px`);

    assert.ok(minX >= 50, `minX (${minX}) should be >= 50 (margin away from origin 0,0)`);
    assert.ok(minY >= 50, `minY (${minY}) should be >= 50 (margin away from origin 0,0)`);
    assert.ok(maxX <= 2000, `maxX (${maxX}) should be within reasonable bounds (<= 2000)`);
    assert.ok(maxY <= 1200, `maxY (${maxY}) should be within reasonable bounds (<= 1200)`);

    // Exhaustive Pairwise AABB Intersection Test
    const overlaps = [];
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const a = components[i];
        const b = components[j];

        const interX1 = Math.max(a.x, b.x);
        const interX2 = Math.min(a.x2, b.x2);
        const interY1 = Math.max(a.y, b.y);
        const interY2 = Math.min(a.y2, b.y2);

        const interW = Math.max(0, interX2 - interX1);
        const interH = Math.max(0, interY2 - interY1);
        const area = interW * interH;

        if (area > 0) {
          overlaps.push({
            compA: `${a.id}:${a.name} [x:${a.x}, y:${a.y}, w:${a.w}, h:${a.h}]`,
            compB: `${b.id}:${b.name} [x:${b.x}, y:${b.y}, w:${b.w}, h:${b.h}]`,
            overlapArea: area,
            intersectionBox: {
              x1: interX1,
              y1: interY1,
              x2: interX2,
              y2: interY2,
              w: interW,
              h: interH,
            },
          });
        }
      }
    }

    if (overlaps.length > 0) {
      console.error('\n[CHALLENGER ERROR] Detected AABB overlaps between components:');
      console.error(JSON.stringify(overlaps, null, 2));
    }

    assert.strictEqual(
      overlaps.length,
      0,
      `Detected ${overlaps.length} pairwise AABB overlaps among 96 components on Mobile - Komponen!`,
    );
  });

  await t.test(
    '3. Mobile - Autentikasi (9 Frames) Dimensions, Spacing, and Non-Empty Children Test',
    () => {
      const pageId = doc.pages.find((id) => doc.nodes[id]?.name === 'Mobile - Autentikasi');
      assert.ok(pageId, 'Page "Mobile - Autentikasi" must exist');

      const page = doc.nodes[pageId];
      assert.strictEqual(
        page.children.length,
        9,
        `Expected exactly 9 frames on Mobile - Autentikasi, found ${page.children.length}`,
      );

      const frames = [];
      for (const childId of page.children) {
        const node = doc.nodes[childId];
        assert.ok(node, `Frame node ${childId} must exist`);
        assert.strictEqual(node.type.toLowerCase(), 'frame', `Node ${childId} must be frame`);
        assert.strictEqual(node.width, 390, `Frame ${childId} ("${node.name}") width must be 390`);
        assert.ok(
          node.height >= 844,
          `Frame ${childId} ("${node.name}") height must be >= 844 (found ${node.height})`,
        );

        assert.ok(
          node.name && node.name.trim().length > 0,
          `Frame ${childId} must have a non-empty name`,
        );
        assert.ok(
          Array.isArray(node.children) && node.children.length > 0,
          `Frame ${childId} ("${node.name}") MUST have non-empty children (found ${node.children?.length})`,
        );

        const x = node.transform ? node.transform[4] : 0;
        const y = node.transform ? node.transform[5] : 0;

        frames.push({
          id: childId,
          name: node.name,
          x,
          y,
          w: node.width,
          h: node.height,
          x2: x + node.width,
          y2: y + node.height,
          childrenCount: node.children.length,
        });
      }

      // Check pairwise AABB collision between the 9 frames (they should not overlap each other)
      const frameOverlaps = [];
      for (let i = 0; i < frames.length; i++) {
        for (let j = i + 1; j < frames.length; j++) {
          const a = frames[i];
          const b = frames[j];

          const interW = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x));
          const interH = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
          if (interW * interH > 0) {
            frameOverlaps.push({
              frameA: `${a.id}:${a.name}`,
              frameB: `${b.id}:${b.name}`,
              overlapArea: interW * interH,
            });
          }
        }
      }
      assert.strictEqual(
        frameOverlaps.length,
        0,
        `Autentikasi frames overlap: ${JSON.stringify(frameOverlaps)}`,
      );

      // Verify reasonable spacing: horizontal progression
      frames.sort((a, b) => a.x - b.x);
      for (let i = 0; i < frames.length - 1; i++) {
        const gap = frames[i + 1].x - frames[i].x2;
        assert.ok(
          gap >= 20,
          `Gap between Auth frame ${frames[i].name} and ${frames[i + 1].name} is too small (${gap}px < 20px)`,
        );
      }
    },
  );

  await t.test(
    '4. Mobile - Aplikasi (17 Frames) Dimensions, Spacing, and Non-Empty Children Test',
    () => {
      const pageId = doc.pages.find((id) => doc.nodes[id]?.name === 'Mobile - Aplikasi');
      assert.ok(pageId, 'Page "Mobile - Aplikasi" must exist');

      const page = doc.nodes[pageId];
      assert.strictEqual(
        page.children.length,
        17,
        `Expected exactly 17 frames on Mobile - Aplikasi, found ${page.children.length}`,
      );

      const frames = [];
      for (const childId of page.children) {
        const node = doc.nodes[childId];
        assert.ok(node, `Frame node ${childId} must exist`);
        assert.strictEqual(node.type.toLowerCase(), 'frame', `Node ${childId} must be frame`);
        assert.strictEqual(node.width, 390, `Frame ${childId} ("${node.name}") width must be 390`);
        assert.ok(
          node.height >= 844,
          `Frame ${childId} ("${node.name}") height must be >= 844 (found ${node.height})`,
        );

        assert.ok(
          node.name && node.name.trim().length > 0,
          `Frame ${childId} must have a non-empty name`,
        );
        assert.ok(
          Array.isArray(node.children) && node.children.length > 0,
          `Frame ${childId} ("${node.name}") MUST have non-empty children (found ${node.children?.length})`,
        );

        const x = node.transform ? node.transform[4] : 0;
        const y = node.transform ? node.transform[5] : 0;

        frames.push({
          id: childId,
          name: node.name,
          x,
          y,
          w: node.width,
          h: node.height,
          x2: x + node.width,
          y2: y + node.height,
          childrenCount: node.children.length,
        });
      }

      // Check pairwise AABB collision between the 17 frames
      const frameOverlaps = [];
      for (let i = 0; i < frames.length; i++) {
        for (let j = i + 1; j < frames.length; j++) {
          const a = frames[i];
          const b = frames[j];

          const interW = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x));
          const interH = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
          if (interW * interH > 0) {
            frameOverlaps.push({
              frameA: `${a.id}:${a.name}`,
              frameB: `${b.id}:${b.name}`,
              overlapArea: interW * interH,
            });
          }
        }
      }
      assert.strictEqual(
        frameOverlaps.length,
        0,
        `Aplikasi frames overlap: ${JSON.stringify(frameOverlaps)}`,
      );

      // Verify reasonable spacing: horizontal progression
      frames.sort((a, b) => a.x - b.x);
      for (let i = 0; i < frames.length - 1; i++) {
        const gap = frames[i + 1].x - frames[i].x2;
        assert.ok(
          gap >= 20,
          `Gap between App frame ${frames[i].name} and ${frames[i + 1].name} is too small (${gap}px < 20px)`,
        );
      }
    },
  );

  await t.test('5. Web Pages Presence and Structure', () => {
    const landingPageId = doc.pages.find((id) => doc.nodes[id]?.name === 'Web - Landing Page');
    const adminPageId = doc.pages.find((id) => doc.nodes[id]?.name === 'Web - Admin Dashboard');

    assert.ok(landingPageId, 'Page "Web - Landing Page" must exist');
    assert.ok(adminPageId, 'Page "Web - Admin Dashboard" must exist');

    const landingPage = doc.nodes[landingPageId];
    assert.strictEqual(
      landingPage.children.length,
      2,
      'Web - Landing Page must have 2 frames (Desktop & Mobile)',
    );
    for (const childId of landingPage.children) {
      const node = doc.nodes[childId];
      assert.ok(
        node.children && node.children.length > 0,
        `Landing frame ${node.name} must have children`,
      );
      console.log(
        `[CHALLENGER] Web Landing Frame: "${node.name}" (${node.width}x${node.height}), children: ${node.children.length}`,
      );
    }

    const adminPage = doc.nodes[adminPageId];
    assert.strictEqual(adminPage.children.length, 1, 'Web - Admin Dashboard must have 1 frame');
    const adminFrame = doc.nodes[adminPage.children[0]];
    assert.ok(
      adminFrame.children && adminFrame.children.length > 0,
      'Admin frame must have children',
    );
    console.log(
      `[CHALLENGER] Web Admin Frame: "${adminFrame.name}" (${adminFrame.width}x${adminFrame.height}), children: ${adminFrame.children.length}`,
    );
  });

  await t.test('6. Deep Hierarchy & Minimum Distance Boundary Verification', () => {
    const p1 = doc.nodes[doc.pages.find((id) => doc.nodes[id]?.name === 'Mobile - Komponen')];
    const boxes = p1.children.map((id) => {
      const n = doc.nodes[id];
      const x = n.transform[4];
      const y = n.transform[5];
      return { id, name: n.name, x, y, w: n.width, h: n.height, x2: x + n.width, y2: y + n.height };
    });

    let minHorizontalClearance = Infinity;
    let minVerticalClearance = Infinity;

    let minVPair = null;
    let minHPair = null;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];

        // Check if projected onto Y axis they overlap:
        const yOverlap = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
        if (yOverlap > 0) {
          const hDist = a.x < b.x ? b.x - a.x2 : a.x - b.x2;
          if (hDist >= 0 && hDist < minHorizontalClearance) {
            minHorizontalClearance = hDist;
            minHPair = `${a.name} <-> ${b.name}`;
          }
        }

        // Check if projected onto X axis they overlap:
        const xOverlap = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x));
        if (xOverlap > 0) {
          const vDist = a.y < b.y ? b.y - a.y2 : a.y - b.y2;
          if (vDist >= 0 && vDist < minVerticalClearance) {
            minVerticalClearance = vDist;
            minVPair = `${a.name} <-> ${b.name}`;
          }
        }
      }
    }

    console.log(
      `[CHALLENGER] Minimum Horizontal Clearance: ${minHorizontalClearance}px between ${minHPair}`,
    );
    console.log(
      `[CHALLENGER] Minimum Vertical Clearance: ${minVerticalClearance}px between ${minVPair}`,
    );
    assert.ok(
      minHorizontalClearance >= 10,
      `Horizontal clearance must be >= 10px (got ${minHorizontalClearance}px)`,
    );
    assert.ok(
      minVerticalClearance >= 10,
      `Vertical clearance must be >= 10px (got ${minVerticalClearance}px)`,
    );
  });

  await t.test('7. Page 2001 (00 · Sistem Desain) Preservation', () => {
    const p0 = doc.nodes['2001'];
    assert.ok(p0, 'Page 2001 must exist');
    assert.strictEqual(p0.name, '00 · Sistem Desain');
    assert.strictEqual(p0.children.length, 2, 'Page 2001 must have 2 top-level frames');
    const f1 = doc.nodes[p0.children[0]];
    const f2 = doc.nodes[p0.children[1]];
    assert.strictEqual(f1.name, 'Palet warna · kode aktual');
    assert.strictEqual(f2.name, 'Tipografi, radius & jarak');
  });

  await t.test('8. FigCraft CLI Render Stress Verification', () => {
    // Render Mobile - Komponen
    const outKomponen = path.join(ROOT_DIR, 'dist/test_challenger_komponen.png');
    execSync(
      `"${FIGCRAFT_CLI}" render --page "Mobile - Komponen" --out "${outKomponen}" "${TARGET_FIGCRAFT}"`,
      {
        stdio: 'pipe',
      },
    );
    assert.ok(fs.existsSync(outKomponen), 'Rendered test_challenger_komponen.png must exist');
    const statK = fs.statSync(outKomponen);
    assert.ok(statK.size > 10000, `Rendered file size must be > 10KB, got ${statK.size}`);

    // Render Mobile - Autentikasi
    const outAuth = path.join(ROOT_DIR, 'dist/test_challenger_auth.png');
    execSync(
      `"${FIGCRAFT_CLI}" render --page "Mobile - Autentikasi" --out "${outAuth}" "${TARGET_FIGCRAFT}"`,
      {
        stdio: 'pipe',
      },
    );
    assert.ok(fs.existsSync(outAuth), 'Rendered test_challenger_auth.png must exist');
    const statA = fs.statSync(outAuth);
    assert.ok(statA.size > 10000, `Rendered file size must be > 10KB, got ${statA.size}`);

    // Render Mobile - Aplikasi
    const outApp = path.join(ROOT_DIR, 'dist/test_challenger_app.png');
    execSync(
      `"${FIGCRAFT_CLI}" render --page "Mobile - Aplikasi" --out "${outApp}" "${TARGET_FIGCRAFT}"`,
      {
        stdio: 'pipe',
      },
    );
    assert.ok(fs.existsSync(outApp), 'Rendered test_challenger_app.png must exist');
    const statApp = fs.statSync(outApp);
    assert.ok(statApp.size > 10000, `Rendered file size must be > 10KB, got ${statApp.size}`);
  });
});
