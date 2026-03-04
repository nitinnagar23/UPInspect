// ============================================================
// router.js — App-level view routing & tab switching
// UPInspect
// ============================================================

import { stopScanner } from './scanner.js';

// Map view name → [viewId, navId]
const VIEW_MAP = {
  home:  ['viewHome',  'navHome'],
  tools: ['viewTools', 'navTools'],
  about: ['viewAbout', 'navAbout'],
};

/**
 * Switch the active top-level view.
 * @param {'home'|'tools'|'about'} viewName
 */
export function switchAppView(viewName) {
  if (viewName !== 'tools') stopScanner();

  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const [viewId, navId] = VIEW_MAP[viewName] ?? [];
  if (viewId) document.getElementById(viewId).classList.add('active');
  if (navId)  document.getElementById(navId).classList.add('active');

  // Show footer on Home and About; hide on Tools
  const footer = document.getElementById('siteFooter');
  if (footer) footer.classList.toggle('hidden', viewName === 'tools');

  window.scrollTo(0, 0);
}

/**
 * Navigate to a specific tool tab directly (e.g. from Home feature cards).
 * @param {'scanTab'|'createTab'} toolTabId
 */
export function navToTools(toolTabId) {
  switchAppView('tools');
  const btnId = toolTabId === 'scanTab' ? 'tabScan' : 'tabCreate';
  switchToolTab(toolTabId, document.getElementById(btnId));
}

/**
 * Switch the active tab inside the Tools view.
 * @param {'scanTab'|'createTab'} tabId
 * @param {HTMLElement} btnElement - The clicked tab button
 */
export function switchToolTab(tabId, btnElement) {
  // Hide all tab content panels
  document.querySelectorAll('.tool-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  // Update tab button states
  document.querySelectorAll('.tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  // Always hide the extracted result when switching tabs
  document.getElementById('extractedCard').classList.add('hidden');

  // Stop camera if leaving scan tab
  if (tabId === 'createTab') stopScanner();
}
