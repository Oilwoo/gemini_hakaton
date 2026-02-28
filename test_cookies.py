import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_cookies")

def verify():
    cookie_path = os.environ.get("COOKIES_PATH", "cookies.txt")
    if not os.path.isabs(cookie_path):
        cookie_path = os.path.join(os.getcwd(), cookie_path)
    
    print("-" * 40)
    print("YouTube Cookie Verification")
    print("-" * 40)
    
    if os.path.exists(cookie_path):
        logger.info(f"SUCCESS: Found cookies.txt at {cookie_path}")
        try:
            with open(cookie_path, 'r') as f:
                content = f.read(100)
                if "# Netscape HTTP Cookie File" in content:
                    logger.info("VALID: File format appears to be Netscape HTTP Cookie File.")
                else:
                    logger.warning("WARNING: File does not contain the Netscape header. Ensure it's exported correctly.")
        except Exception as e:
            logger.error(f"FAILURE: Could not read cookie file: {e}")
    else:
        logger.error(f"FAILURE: cookies.txt NOT FOUND at {cookie_path}")
        print("\nPlease follow the instructions in walkthrough.md to export and save your cookies.")

if __name__ == "__main__":
    verify()
