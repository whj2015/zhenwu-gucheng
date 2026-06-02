from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    
    page.goto('http://localhost:3001/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    
    # Click "城门" to go to the gate
    page.locator('button:has-text("城门")').first.click()
    page.wait_for_timeout(500)
    
    # Click "兵马出征" to deploy
    page.locator('button:has-text("兵马出征")').first.click()
    page.wait_for_timeout(1000)
    
    # Find all clickable elements with "探索" text
    explore_elements = page.locator(':has-text("探索")')
    print(f"Elements with '探索': {explore_elements.count()}")
    
    # Try clicking the first non-button element that has "探索" text
    # Look for elements that are clickable
    for i in range(explore_elements.count()):
        el = explore_elements.nth(i)
        try:
            tag = el.evaluate("el => el.tagName")
            text = el.inner_text()[:50]
            print(f"  [{i}] tag={tag} text='{text}'")
        except:
            pass
    
    # Try to click the first "探索" element
    explore_btns = page.locator('text=探索')
    print(f"\n'text=探索' count: {explore_btns.count()}")
    if explore_btns.count() > 0:
        explore_btns.first.click()
        page.wait_for_timeout(3000)
    
    page.screenshot(path='/workspace/screenshots/explore.png', full_page=True)
    
    print("\n=== EXPLORE PAGE TEXT ===")
    body = page.inner_text('body')
    print(body[:3000])
    
    # Print battle-related console logs
    print("\n=== BATTLE LOGS ===")
    for log in console_logs:
        if any(kw in log for kw in ['RENDER_TOP', 'ENEMIES_CHANGED', 'EXECUTE', 'SET_ENEMIES', 'MOUNT', 'UNMOUNT', 'BATTLE', 'battle', 'RENDER']):
            print(log)
    
    browser.close()