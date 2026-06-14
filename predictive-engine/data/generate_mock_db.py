import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Configuration
NUM_USERS = 100
DAYS_OF_HISTORY = 180
START_DATE = datetime.now() - timedelta(days=DAYS_OF_HISTORY)

# Product Catalog (Matching your Amazon Now categories)
PRODUCTS = {
    "P001": {"name": "Amul Milk 1L", "category": "dairy", "price": 1.50},
    "P002": {"name": "Whole Wheat Bread", "category": "pantry", "price": 2.00},
    "P003": {"name": "Farm Eggs 12pk", "category": "dairy", "price": 3.50},
    "P004": {"name": "Nescafe Coffee 100g", "category": "beverage", "price": 5.00},
    "P005": {"name": "Refined Sugar 1kg", "category": "pantry", "price": 1.20},
    "P006": {"name": "Lays Classic Chips", "category": "snacks", "price": 1.00},
    "P007": {"name": "Coca Cola 2L", "category": "beverage", "price": 2.50},
    "P008": {"name": "Quaker Oats 1kg", "category": "pantry", "price": 4.00},
    "P009": {"name": "Apples 1kg", "category": "produce", "price": 3.00},
    "P010": {"name": "Olive Oil 500ml", "category": "pantry", "price": 8.00}
}

# Personas dictate purchase frequency and basket affinity
PERSONAS = [
    {
        "name": "Family",
        "weight": 0.5, # 50% of users
        "cycle_days": 4, # Shops roughly every 4 days
        "basket_pool": ["P001", "P002", "P003", "P009"], # High affinity: Milk, Bread, Eggs, Apples
        "basket_size": (3, 4)
    },
    {
        "name": "Professional",
        "weight": 0.3, # 30% of users
        "cycle_days": 14, # Shops bi-weekly
        "basket_pool": ["P004", "P005", "P008", "P010"], # High affinity: Coffee, Sugar, Oats, Oil
        "basket_size": (2, 4)
    },
    {
        "name": "Weekend Snacker",
        "weight": 0.2, # 20% of users
        "cycle_days": 7, # Shops weekly
        "basket_pool": ["P006", "P007"], # High affinity: Chips, Soda
        "basket_size": (1, 2)
    }
]

def generate_data():
    records = []
    order_id_counter = 1000
    
    print(f"Generating data for {NUM_USERS} users over {DAYS_OF_HISTORY} days...")

    for user_id in range(1, NUM_USERS + 1):
        # Assign persona
        persona = random.choices(PERSONAS, weights=[p["weight"] for p in PERSONAS])[0]
        
        current_date = START_DATE
        
        while current_date < datetime.now():
            # Add some randomness to the cycle (±1 day) so it's not too robotic
            jitter = random.randint(-1, 1)
            days_to_add = persona["cycle_days"] + jitter
            current_date += timedelta(days=max(1, days_to_add))
            
            if current_date > datetime.now():
                break

            # Force Snacker to buy mostly on Fridays/Saturdays (day 4 or 5)
            if persona["name"] == "Weekend Snacker" and current_date.weekday() not in [4, 5]:
                # Shift to Friday
                current_date += timedelta(days=(4 - current_date.weekday()) % 7)

            # Generate basket
            num_items = random.randint(*persona["basket_size"])
            
            # 80% chance to pick from their persona pool (strong affinity), 20% random discovery
            basket = []
            for _ in range(num_items):
                if random.random() < 0.8:
                    item = random.choice(persona["basket_pool"])
                else:
                    item = random.choice(list(PRODUCTS.keys()))
                
                # Avoid duplicate items in same order
                if item not in basket:
                    basket.append(item)

            for item in basket:
                records.append({
                    "order_id": f"ORD-{order_id_counter}",
                    "user_id": f"U{user_id:03d}",
                    "order_date": current_date.strftime("%Y-%m-%d"),
                    "product_id": item,
                    "product_name": PRODUCTS[item]["name"],
                    "category": PRODUCTS[item]["category"],
                    "quantity": random.randint(1, 2), # Usually buy 1 or 2
                    "price": PRODUCTS[item]["price"]
                })
            
            order_id_counter += 1

    df = pd.DataFrame(records)
    
    # Sort chronologically
    df = df.sort_values(by="order_date").reset_index(drop=True)
    
    output_path = "synthetic_orders.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Generated {len(df)} rows of training data at {output_path}!")

if __name__ == "__main__":
    generate_data()