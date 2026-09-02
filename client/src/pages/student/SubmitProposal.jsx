import { useState } from "react";
import { useDispatch } from "react-redux";
import { FileText, Info, LoaderCircle, Send } from "lucide-react";
import { submitProjectProposal } from "../../store/slices/studentSlice";

const SubmitProposal = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [isLoading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(submitProjectProposal(formData)).unwrap();
      setFormData({ title: "", description: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-blue-100 p-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Submit Project Proposal
            </h1>
            <p className="mt-1 text-[0.9375rem] text-slate-500">
              Share a clear and detailed project idea for your supervisor to
              review.
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-[0.9375rem] font-medium text-slate-700"
              >
                Project Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter your project title"
                maxLength={200}
                required
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-[0.9375rem] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-[0.9375rem] font-medium text-slate-700"
              >
                Project Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the problem, objectives, proposed approach, expected outcome, and project scope."
                maxLength={2000}
                rows={8}
                required
                className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-[0.9375rem] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {formData.description.length}/2000
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </form>

        <aside className="self-start rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-blue-900">
                Proposal Guidelines
              </h2>
              <p className="mt-1 text-[0.9375rem] leading-6 text-blue-800">
                Keep your proposal clear and concise. Include:
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-blue-800">
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>The problem your project will address</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Your project objectives</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Your proposed approach</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>The expected outcome and project scope</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Key features or major project components</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Relevant technologies or tools you plan to use</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SubmitProposal;
