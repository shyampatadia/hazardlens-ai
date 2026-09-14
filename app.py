import spaces
import gradio as gr

from helpers import (
    detect_objects,
    draw_detections,
    expand_goal,
    summarize_detections,
)


@spaces.GPU(duration=120)
def analyze_image(image, goal, threshold):
    """Run the complete HazardLens analysis."""
    if image is None:
        raise gr.Error("Please upload an image.")

    if not goal or not goal.strip():
        raise gr.Error("Please describe what you want to inspect.")

    labels, backend, message = expand_goal(image, goal.strip(), "Auto")
    if not labels:
        status = message or "No matching objects were found."
        return image, "None", "No matching objects were detected.", backend, status

    detections = detect_objects(image, labels, threshold)
    annotated_image = draw_detections(image, detections)
    summary = summarize_detections(detections)
    status = message or "Analysis completed successfully."

    return annotated_image, ", ".join(labels), summary, backend, status


with gr.Blocks(title="HazardLens AI") as demo:
    gr.Markdown(
        "# HazardLens AI\n"
        "Upload a workplace image and describe what you want to inspect."
    )

    with gr.Row():
        with gr.Column():
            image_input = gr.Image(type="pil", label="Workplace image")
            goal_input = gr.Textbox(
                label="Inspection request",
                placeholder="Find anything blocking the emergency exit",
            )
            threshold_input = gr.Slider(
                minimum=0.01,
                maximum=0.5,
                value=0.10,
                step=0.01,
                label="Detection threshold",
            )
            analyze_button = gr.Button("Analyze image", variant="primary")

        with gr.Column():
            image_output = gr.Image(label="Inspection result")
            labels_output = gr.Textbox(label="Objects searched")
            summary_output = gr.Textbox(label="Objects detected")
            backend_output = gr.Textbox(label="Vision model used")
            status_output = gr.Textbox(label="Status")

    gr.Markdown("HazardLens provides an AI-assisted pre-check, not a certified safety inspection.")

    analyze_button.click(
        fn=analyze_image,
        inputs=[image_input, goal_input, threshold_input],
        outputs=[
            image_output,
            labels_output,
            summary_output,
            backend_output,
            status_output,
        ],
    )


if __name__ == "__main__":
    demo.launch(ssr_mode=False)
