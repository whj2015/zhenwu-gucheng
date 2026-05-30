from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 收集网络请求和响应
    responses = []
    page.on("response", lambda response: responses.append({
        "url": response.url,
        "status": response.status,
        "headers": dict(response.headers)
    }))

    # 收集控制台消息
    console_messages = []
    page.on("console", lambda msg: console_messages.append({
        "type": msg.type,
        "text": msg.text
    }))

    try:
        print("正在访问 URL...")
        page.goto('https://run-agent-6a1a46cf7e3b19558ba34170-mprt1st1-preview.agent-sandbox-bj-c1-gw.trae.cn/', timeout=10000)

        # 等待页面加载
        page.wait_for_load_state('networkidle')

        # 截图
        page.screenshot(path='/workspace/page_screenshot.png', full_page=True)
        print("\n✅ 截图已保存到: /workspace/page_screenshot.png")

        # 获取页面内容
        content = page.content()
        print("\n📄 页面内容:")
        print(content[:2000] if len(content) > 2000 else content)

        # 获取响应信息
        print(f"\n📡 收集到 {len(responses)} 个网络响应")
        for i, resp in enumerate(responses[:5]):
            print(f"\n--- 响应 {i+1} ---")
            print(f"URL: {resp['url']}")
            print(f"状态码: {resp['status']}")
            if 'content-type' in resp['headers']:
                print(f"Content-Type: {resp['headers']['content-type']}")

        # 控制台消息
        if console_messages:
            print(f"\n💬 控制台消息 ({len(console_messages)} 条):")
            for msg in console_messages[:10]:
                print(f"[{msg['type'].upper()}] {msg['text']}")

    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")

    finally:
        browser.close()
