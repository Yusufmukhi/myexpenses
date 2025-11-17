import tkinter as tk
root = tk.Tk()
def click():
    label.config(text="clicked")
label=tk.Label(text="hiii")
label.pack()
button=tk.Button(text="Hiii",command=click)

button.pack()
entry_label = tk.Label(root, text="Enter your name:")
entry_label.pack()
entry = tk.Entry(
 root,
 font=("Arial", 12), 
 fg="gray" 
)
entry.pack(pady=5)

root.mainloop()
