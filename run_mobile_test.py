from playwright.sync_api import sync_playwright
import os
import json

def test_mobile_responsiveness():
    """Test mobile responsiveness of all pages after refactoring"""
    
    results = {
        'tests': [],
        'screenshots': [],
        'issues': []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Test different mobile viewport sizes
        viewports = [
            {'width': 375, 'height': 812, 'name': 'iPhone_X'},
            {'width': 390, 'height': 844, 'name': 'iPhone_12'},
            {'width': 768, 'height': 1024, 'name': 'iPad'},
        ]
        
        for viewport in viewports:
            context = browser.new_context(
                viewport={'width': viewport['width'], 'height': viewport['height']},
                is_mobile=True,
                has_touch=True
            )
            page = context.new_page()
            
            viewport_result = {
                'device': viewport['name'],
                'size': f"{viewport['width']}x{viewport['height']}",
                'panels': []
            }
            
            try:
                page.goto('http://localhost:5173')
                page.wait_for_load_state('networkidle')
                
                # Take initial screenshot
                screenshot_path = f'/workspace/test_results/{viewport["name"]}_initial.png'
                os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
                page.screenshot(path=screenshot_path, full_page=False)
                results['screenshots'].append(screenshot_path)
                
                # Test navigation tabs visibility
                tabs = page.locator('nav button')
                tab_count = tabs.count()
                
                if tab_count == 8:  # Expected: city, hospital, market, barracks, forge, heroes, warehouse, gate
                    viewport_result['tests'].append({
                        'test': 'navigation_tabs',
                        'status': 'PASS',
                        'message': f'Found all {tab_count} navigation tabs'
                    })
                else:
                    viewport_result['tests'].append({
                        'test': 'navigation_tabs',
                        'status': 'FAIL',
                        'message': f'Expected 8 tabs, found {tab_count}'
                    })
                    results['issues'].append(f"{viewport['name']}: Navigation tabs count mismatch")
                
                # Check bottom nav bar is visible and not overflowing
                nav_bar = page.locator('nav.fixed.bottom-0')
                if nav_bar.count() > 0:
                    nav_box = nav_bar.bounding_box()
                    if nav_box and nav_box['width'] <= viewport['width']:
                        viewport_result['tests'].append({
                            'test': 'bottom_nav_visible',
                            'status': 'PASS',
                            'message': f'Bottom nav visible ({nav_box["width"]:.0f}px wide)'
                        })
                    else:
                        viewport_result['tests'].append({
                            'test': 'bottom_nav_visible',
                            'status': 'FAIL',
                            'message': 'Bottom nav overflow or hidden'
                        })
                        results['issues'].append(f"{viewport['name']}: Bottom navigation issue")
                
                # Test each main panel
                panels = [
                    ('city', '主城署'),
                    ('hospital', '医馆'),
                    ('market', '集市'),
                    ('barracks', '募兵营'),
                    ('forge', '兵甲坊'),
                    ('heroes', '门客'),
                    ('warehouse', '库房'),
                    ('gate', '城门'),
                ]
                
                for panel_id, panel_name in panels:
                    try:
                        # Click on the panel tab
                        tab_button = page.locator(f'nav button:has-text("{panel_name}")').first
                        if tab_button.count() > 0:
                            tab_button.click()
                            page.wait_for_timeout(300)
                            
                            # Take screenshot of this panel
                            panel_screenshot = f'/workspace/test_results/{viewport["name"]}_{panel_id}.png'
                            page.screenshot(path=panel_screenshot, full_page=True)
                            results['screenshots'].append(panel_screenshot)
                            
                            # Check for horizontal scrollbar (indicates content overflow)
                            has_horizontal_scroll = page.evaluate('''() => {
                                const mainContent = document.querySelector('main > div:nth-child(2)');
                                if (mainContent) {
                                    return mainContent.scrollWidth > mainContent.clientWidth;
                                }
                                return false;
                            }''')
                            
                            if not has_horizontal_scroll:
                                viewport_result['panels'].append({
                                    'id': panel_id,
                                    'name': panel_name,
                                    'status': 'PASS',
                                    'message': 'No horizontal overflow'
                                })
                            else:
                                viewport_result['panels'].append({
                                    'id': panel_id,
                                    'name': panel_name,
                                    'status': 'FAIL',
                                    'message': 'Horizontal overflow detected!'
                                })
                                results['issues'].append(f"{viewport['name']}/{panel_name}: Horizontal overflow")
                            
                            # Check if buttons are accessible (not hidden)
                            visible_buttons = page.evaluate('''() => {
                                const buttons = document.querySelectorAll('button:not([style*="display: none"])');
                                return buttons.length;
                            }''')
                            
                            if visible_buttons > 0:
                                pass  # Buttons are visible
                                
                        else:
                            viewport_result['panels'].append({
                                'id': panel_id,
                                'name': panel_name,
                                'status': 'WARN',
                                'message': 'Tab not found'
                            })
                            results['issues'].append(f"{viewport['name']}/{panel_name}: Tab not found")
                            
                    except Exception as e:
                        viewport_result['panels'].append({
                            'id': panel_id,
                            'name': panel_name,
                            'status': 'ERROR',
                            'message': str(e)
                        })
                        results['issues'].append(f"{viewport['name']}/{panel_name}: Error - {str(e)}")
                
                # Check content area padding for mobile
                padding_check = page.evaluate('''() => {
                    const mainContent = document.querySelector('main > div:nth-child(2)');
                    if (mainContent) {
                        const style = window.getComputedStyle(mainContent);
                        return {
                            paddingBottom: style.paddingBottom,
                            overflowY: style.overflowY
                        };
                    }
                    return null;
                }''')
                
                if padding_check:
                    pb_value = float(padding_check['paddingBottom'].replace('px', ''))
                    if pb_value >= 80:  # Should have enough padding for bottom nav
                        viewport_result['tests'].append({
                            'test': 'content_padding',
                            'status': 'PASS',
                            'message': f"Bottom padding: {padding_check['paddingBottom']} (sufficient)"
                        })
                    else:
                        viewport_result['tests'].append({
                            'test': 'content_padding',
                            'status': 'FAIL',
                            'message': f"Bottom padding too small: {padding_check['paddingPadding']}"
                        })
                        results['issues'].append(f"{viewport['name']}: Insufficient bottom padding")
                
            except Exception as e:
                viewport_result['tests'].append({
                    'test': 'page_load',
                    'status': 'ERROR',
                    'message': str(e)
                })
                results['issues'].append(f"{viewport['name']}: Critical error - {str(e)}")
            
            results['tests'].append(viewport_result)
            context.close()
        
        browser.close()
    
    # Generate report
    total_tests = sum(len(v.get('tests', [])) + len(v.get('panels', [])) for v in results['tests'])
    passed_tests = sum(
        len([t for t in v.get('tests', []) if t.get('status') == 'PASS']) +
        len([p for p in v.get('panels', []) if p.get('status') == 'PASS'])
        for v in results['tests']
    )
    failed_tests = sum(
        len([t for t in v.get('tests', []) if t.get('status') == 'FAIL']) +
        len([p for p in v.get('panels', []) if p.get('status') == 'FAIL'])
        for v in results['tests']
    )
    
    results['summary'] = {
        'total_tests': total_tests,
        'passed': passed_tests,
        'failed': failed_tests,
        'pass_rate': f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A",
        'issues_count': len(results['issues']),
        'screenshots_count': len(results['screenshots'])
    }
    
    # Save detailed results
    with open('/workspace/test_results/mobile_test_report.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    return results

if __name__ == '__main__':
    print("🚀 Starting Mobile Responsiveness Test Suite...")
    print("=" * 60)
    
    results = test_mobile_responsiveness()
    
    print("\n📊 TEST SUMMARY")
    print("=" * 60)
    summary = results['summary']
    print(f"✅ Total Tests: {summary['total_tests']}")
    print(f"✅ Passed: {summary['passed']}")
    print(f"❌ Failed: {summary['failed']}")
    print(f"📈 Pass Rate: {summary['pass_rate']}")
    print(f"📸 Screenshots: {summary['screenshots_count']}")
    print(f"⚠️  Issues Found: {summary['issues_count']}")
    
    if results['issues']:
        print("\n❌ ISSUES DETECTED:")
        print("-" * 60)
        for i, issue in enumerate(results['issues'], 1):
            print(f"{i}. {issue}")
    else:
        print("\n🎉 All tests passed! Mobile optimization successful!")
    
    print("\n📁 Detailed report saved to: /workspace/test_results/mobile_test_report.json")
    print("📸 Screenshots saved to: /workspace/test_results/")
