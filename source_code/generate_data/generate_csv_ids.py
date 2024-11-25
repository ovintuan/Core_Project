import csv
import uuid
from random import choice

# Load Product IDs from CSV file
def load_product_info(file_path):
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        return list(reader)

product_info = load_product_info('/../local_data_storage/master_data/ProductMasterData.csv')

# Function to generate dummy IDs and save to CSV
def generate_ids_to_csv(file_path, num_records, columns, headers, use_product_info=False):
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(headers)  # Write the header
        for _ in range(num_records):
            row = [str(uuid.uuid4()) for _ in range(columns)]
            if use_product_info:
                product = choice(product_info)
                row[1] = product['ProductID']  # Use ProductID from master data
            writer.writerow(row)

# Generate CSV for CustomerProductAccount IDs
generate_ids_to_csv('/../local_data_storage/master_data/CustomerProductAccountIDs.csv', 10000, 4, ['CustomerID', 'ProductID', 'AccountID'], use_product_info=True)


