import csv
import uuid
from faker import Faker

fake = Faker()

# Define product types for the credit domain
product_types = ["Loan", "Credit Card", "Line of Credit"]

# Function to generate product master data and save to CSV
def generate_product_master_data(file_path, num_records):
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['ProductID', 'ProductName', 'Description', 'InterestRate', 'ProductType'])  # Write the header
        for _ in range(num_records):
            writer.writerow([
                str(uuid.uuid4()),
                fake.word(),
                fake.sentence(),
                round(fake.random_number(digits=2, fix_len=True) / 100, 2),
                fake.random_element(elements=product_types)
            ])

# Generate CSV for Product Master Data
generate_product_master_data('./local_data_storage/master_data/ProductMasterData.csv', 50)